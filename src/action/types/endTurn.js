import { Action } from "../../../engine/action/action.js";
import { ActionIntent } from "../../../engine/action/actionIntent.js";
import { ACTION_TYPE, TEAM_STAT } from "../../enums.js";
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
    const { entityManager } = world;
    const team = teamManager.getCurrentTeam();
    const turn = team.getStatistic(TEAM_STAT.ROUNDS_TAKEN);
    const { id, entities, objectives } = team;

    for(const entityID of entities) {
        const entity = entityManager.getEntity(entityID);

        if(entity) {
            entity.onTurnEnd(gameContext);
        }
    }

    for(const objective of objectives) {
        objective.onTurnEnd(gameContext, turn, id);
    }

    teamManager.clearActive();
    teamManager.updateActor(gameContext);
    teamManager.updateStatus();
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