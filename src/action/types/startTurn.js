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
    const { world, teamManager } = gameContext;
    const { turnManager, eventHandler } = world;
    const { teamID } = data;
    const team = teamManager.getTeam(teamID);
    const { actor } = team;

    turnManager.setCurrentActor(gameContext, actor);
    eventHandler.checkEventTriggers(gameContext);
    teamManager.onNextTurn(gameContext);

    //TODO: Get next turn, then check if any construction grows. Add that as next.
}

StartTurnAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { turnManager } = world;
    const nextActorID = turnManager.getNextActor();

    if(nextActorID !== null) {
        const actor = turnManager.getActor(nextActorID);
        const { teamID } = actor;

        executionPlan.setData({
            "teamID": teamID
        });
    }
}