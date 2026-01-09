import { Action } from "../../../engine/action/action.js";

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
    const { world } = gameContext;
    const { turnManager } = world;
    const { actorID } = data;

    turnManager.cancelActorActions();
    turnManager.getNextActor(gameContext);
}

EndTurnAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { turnManager } = world;
    const { actorID } = actionIntent;

    if(turnManager.isActor(actorID)) {
        executionPlan.setData({
            "actorID": actorID
        });
    }
}