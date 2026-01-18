import { Action } from "../../../engine/action/action.js";
import { createStartTurnIntent } from "../actionHelper.js";

export const EndTurnAction = function() {
    Action.call(this);
}

EndTurnAction.prototype = Object.create(Action.prototype);
EndTurnAction.prototype.constructor = EndTurnAction;

EndTurnAction.prototype.isFinished = function(gameContext, executionPlan) {
    return true;
}

EndTurnAction.prototype.onEnd = function(gameContext, data) {
    this.execute(gameContext, data);
}

EndTurnAction.prototype.execute = function(gameContext, data) {
    const { world, teamManager } = gameContext;
    const { turnManager } = world;
    const { currentActor } = turnManager;
    const team = currentActor.getTeam(gameContext);

    team.endTurn(gameContext);
    turnManager.clearCurrentActor(gameContext);
    teamManager.updateStatus();
}

EndTurnAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { turnManager } = world;
    const { currentActor } = turnManager;

    if(currentActor !== null) {
        executionPlan.setData({});
        executionPlan.addNext(createStartTurnIntent());
    }
}