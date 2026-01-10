import { Action } from "../../../engine/action/action.js";

export const StartTurnAction = function() {
    Action.call(this);
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
    const { world } = gameContext;
    const { turnManager, eventHandler } = world;
    const { actorID } = data;

    turnManager.setCurrentActor(gameContext, actorID);
    eventHandler.checkEventTriggers(gameContext);
}

StartTurnAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { turnManager } = world;
    const nextActorID = turnManager.getNextActor();

    if(nextActorID !== null) {
        executionPlan.setData({
            "actorID": nextActorID
        });
    }
}