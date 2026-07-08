import { Action } from "../../../engine/action/action.js";
import { ActionIntent } from "../../../engine/action/actionIntent.js";
import { ACTION_TYPE, BUILDING_TRAIT, TEAM_STAT, TRAIT_TYPE } from "../../enums.js";
import { TeamManager } from "../../team/teamManager.js";
import { StartTurnVTable } from "./startTurn.js";

const createEndTurnIntent = function() {
    return new ActionIntent(ACTION_TYPE.END_TURN, {});
}

const createEndTurnData = function() {
    return {};
}

const fillEndTurnPlan = function(gameContext, executionPlan, actionIntent) {
    const { teamManager } = gameContext;
    const { currentTeam } = teamManager;

    if(currentTeam !== TeamManager.INVALID_ID) {
        executionPlan.setData(createEndTurnData());
        executionPlan.addNext(StartTurnVTable.createIntent());
    }
}

const executeEndTurn = function(gameContext, data) {
    const { world, teamManager } = gameContext;
    const { entityManager, actorManager, mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const team = teamManager.getCurrentTeam();
    const turn = team.getStatistic(TEAM_STAT.ROUNDS_TAKEN);
    const { id, roster, objectives } = team;

    for(const entityID of roster) {
        const entity = entityManager.getEntity(entityID);

        if(entity) {
            entity.onTurnEnd(gameContext);

            if(entity.hasTrait(TRAIT_TYPE.CONQUEROR)) {
                const { teamID, tileX, tileY } = entity;
                const building = worldMap.getBuilding(tileX, tileY);

                if(building && building.hasTrait(BUILDING_TRAIT.CAPTURABLE)) {
                    if(!teamManager.isAlly(teamID, building.teamID)) {
                        const previousTeam = building.getTeam(gameContext);

                        if(previousTeam) {
                            previousTeam.addStatistic(TEAM_STAT.STRUCTURES_LOST, 1);
                        }

                        team.addStatistic(TEAM_STAT.STRUCTURES_CAPTURED, 1);
                        building.setTeam(teamID);
                        building.dirty = true;
                    }
                }
            }
        }
    }

    for(const objective of objectives) {
        objective.onTurnEnd(gameContext, turn, id);
    }

    teamManager.endTurn();
    actorManager.clearCurrentActor(gameContext);
    teamManager.updateStatus(gameContext);
}

export const EndTurnVTable = {
    createIntent: createEndTurnIntent,
    createData: createEndTurnData,
    fillPlan: fillEndTurnPlan,
    execute: executeEndTurn
};

export const EndTurnAction = function() {
    Action.call(this);
}

EndTurnAction.prototype = Object.create(Action.prototype);
EndTurnAction.prototype.constructor = EndTurnAction;