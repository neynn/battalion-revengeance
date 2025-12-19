import { Action } from "../../../engine/action/action.js";

export const EndTurnAction = function() {
    Action.call(this);
}

EndTurnAction.prototype = Object.create(Action.prototype);
EndTurnAction.prototype.constructor = EndTurnAction;

EndTurnAction.prototype.onStart = function(gameContext, data) {

}

EndTurnAction.prototype.onUpdate = function(gameContext, data) {

}

EndTurnAction.prototype.isFinished = function(gameContext, executionPlan) {
    return true;
}

EndTurnAction.prototype.onEnd = function(gameContext, data) {

}

EndTurnAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { turnManager } = world;
    const { actorID } = actionIntent;

    if(turnManager.isActor(actorID)) {
        //TODO: Skip the current actors turn.
    }
}