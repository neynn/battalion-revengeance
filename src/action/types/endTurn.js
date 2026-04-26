import { Action } from "../../../engine/action/action.js";
import { TEAM_STAT } from "../../enums.js";
import { TeamManager } from "../../team/teamManager.js";
import { createStartTurnIntent } from "../actionHelper.js";

export const EndTurnAction = function() {
    Action.call(this);
}

EndTurnAction.createData = function() {
    return {

    }
}

EndTurnAction.prototype = Object.create(Action.prototype);
EndTurnAction.prototype.constructor = EndTurnAction;

EndTurnAction.prototype.execute = function(gameContext, data) {
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

EndTurnAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { teamManager } = gameContext;
    const { currentTeam } = teamManager;

    if(currentTeam !== TeamManager.INVALID_ID) {
        executionPlan.setData(EndTurnAction.createData());
        executionPlan.addNext(createStartTurnIntent());
    }
}