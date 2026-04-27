import { Action } from "../../../engine/action/action.js";
import { ActionIntent } from "../../../engine/action/actionIntent.js";
import { ACTION_TYPE, INTERRUPT_TYPE, TEAM_STAT, TRAIT_CONFIG, TRAIT_TYPE } from "../../enums.js";
import { TeamManager } from "../../team/teamManager.js";
import { fillEntityResolution } from "../interactionResolver.js";
import { DeathActionVTable } from "./death.js";
import { InterruptVTable } from "./interrupt.js";
import { UncloakVTable } from "./uncloak.js";

const createStartTurnIntent = function() {
    return new ActionIntent(ACTION_TYPE.START_TURN, {});
}

const createStartTurnData = function() {
    return {
        "teamID": TeamManager.INVALID_ID,
        "resolutions": []
    }
}

const fillStartTurnPlan = function(gameContext, executionPlan, actionIntent) {
    const { world, teamManager } = gameContext;
    const { entityManager } = world;
    const teamID = teamManager.getNextTeam();

    if(teamID === TeamManager.INVALID_ID) {
        return;
    }

    const team = teamManager.getTeam(teamID);
    const { entities } = team;
    const deadEntities = [];
    const resolutions = [];

    for(const entityID of entities) {
        const entity = entityManager.getEntity(entityID);

        if(!entity) {
            continue;
        }

        const sotDelta = entity.getStartOfTurnDelta(gameContext);
        const sotHealth = entity.getHealthFromDelta(sotDelta);

        if(sotHealth <= 0) {
            deadEntities.push(entityID);
        } else if(entity.hasTrait(TRAIT_TYPE.RADAR)) {
            executionPlan.addNext(UncloakVTable.createIntent(entityID));
        }

        if(sotDelta !== 0) {
            resolutions.push(fillEntityResolution(entityID, sotDelta, sotHealth));
        }
    }

    if(deadEntities.length !== 0) {
        executionPlan.addNext(DeathActionVTable.createIntent(deadEntities));
    }

    const data = createStartTurnData();

    data.teamID = teamID;
    data.resolutions = resolutions;

    executionPlan.setData(data);
}

const executeStartTurn = function(gameContext, data) {
    const { actionRouter, world, teamManager } = gameContext;
    const { entityManager, eventHandler, mapManager } = world;
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
    
    teamManager.setActive(teamID);
    teamManager.updateActor(gameContext);
    
    const events = eventHandler.getTriggerableEvents(teamManager.turn, teamManager.round);

    for(const event of events) {
        const { id } = event;

        actionRouter.forceEnqueue(gameContext, InterruptVTable.createIntent(INTERRUPT_TYPE.EVENT, id));
        event.execute(gameContext);
    }

    teamManager.updateStatus();
    //TODO: Get next turn, then check if any construction grows. Add that as next.
}

export const StartTurnVTable = {
    createIntent: createStartTurnIntent,
    createData: createStartTurnData,
    fillPlan: fillStartTurnPlan,
    execute: executeStartTurn
};

export const StartTurnAction = function() {
    Action.call(this);
}

StartTurnAction.prototype = Object.create(Action.prototype);
StartTurnAction.prototype.constructor = StartTurnAction;