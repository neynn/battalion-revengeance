import { Action } from "../../../engine/action/action.js";
import { TEAM_STAT, TRAIT_TYPE } from "../../enums.js";
import { TeamManager } from "../../team/teamManager.js";
import { createDeathIntent, createUncloakIntent } from "../actionHelper.js";
import { fillEntityResolution } from "../interactionResolver.js";

export const StartTurnAction = function() {
    Action.call(this);
}

StartTurnAction.createData = function() {
    return {
        "teamID": TeamManager.INVALID_ID,
        "resolutions": []
    }
}

StartTurnAction.prototype = Object.create(Action.prototype);
StartTurnAction.prototype.constructor = StartTurnAction;

StartTurnAction.prototype.isFinished = function(gameContext, executionPlan) {
    return true;
}

StartTurnAction.prototype.onEnd = function(gameContext, data) {
    this.execute(gameContext, data);
}

StartTurnAction.prototype.execute = function(gameContext, data) {
    const { world, teamManager } = gameContext;
    const { entityManager, turnManager, eventHandler, mapManager } = world;
    const { teamID, resolutions } = data;
    const worldMap = mapManager.getActiveMap();
    const team = teamManager.getTeam(teamID);
    const { entities } = team;

    for(const entityID of entities) {
        const entity = entityManager.getEntity(entityID);

        if(entity) {
            entity.onTurnStart();  
        }
    }

    for(const { entityID, delta, health } of resolutions) {
        const entity = entityManager.getEntity(entityID);

        entity.setHealth(health);
    }

    for(const building of worldMap.buildings) {
        const cash = building.generateCash(gameContext);
        
        if(cash !== 0) {
            const team = building.getTeam(gameContext)

            if(team) {
                const totalCash = team.addGeneratedCash(cash);
                //TODO(neyn): Display total cash?
            }
        }
    }

    const { activeTeams } = teamManager;

    for(const teamID of activeTeams) {
        const team = teamManager.getTeam(teamID);

        team.addStatistic(TEAM_STAT.ROUNDS_TAKEN, 1);
    }

    //TODO(neyn): Remove at best.
    const actor = teamManager.findActorByTeam(gameContext, teamID);
    turnManager.setCurrentActor(gameContext, actor.getID());

    teamManager.setActive(teamID);
    eventHandler.checkEventTriggers(gameContext);
    teamManager.updateStatus();
    //TODO: Get next turn, then check if any construction grows. Add that as next.
}

StartTurnAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { turnManager, entityManager } = world;
    const nextActorID = turnManager.getNextActor();

    if(nextActorID === null) {
        return;
    }

    const actor = turnManager.getActor(nextActorID);
    const team = actor.getTeam(gameContext);
    const { entities } = team;
    const deadEntities = [];
    const resolutions = [];

    for(const entityID of entities) {
        const entity = entityManager.getEntity(entityID);

        if(entity) {
            const damage = entity.getTerrainDamage(gameContext);
            const health = entity.getHealthAfterDamage(damage);

            if(health <= 0) {
                deadEntities.push(entityID);
            } else if(entity.hasTrait(TRAIT_TYPE.RADAR)) {
                executionPlan.addNext(createUncloakIntent(entityID));
            }

            if(damage !== 0) {
                resolutions.push(fillEntityResolution(entityID, damage, health));
            }
        }
    }

    if(deadEntities.length !== 0) {
        executionPlan.addNext(createDeathIntent(deadEntities));
    }

    const data = StartTurnAction.createData();

    data.teamID = team.getID();
    data.resolutions = resolutions;

    executionPlan.setData(data);
}