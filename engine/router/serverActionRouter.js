import { Action } from "../action/action.js";
import { ActionRouter } from "./actionRouter.js";

export const ServerActionRouter = function() {
    ActionRouter.call(this);
}

ServerActionRouter.prototype = Object.create(ActionRouter.prototype);
ServerActionRouter.prototype.constructor = ServerActionRouter;

ServerActionRouter.prototype.dispatch = function(gameContext, executionPlan) {
    const { world, client } = gameContext;
    const { actionQueue } = world;
    const { socket } = client;

    actionQueue.enqueue(executionPlan);
    //SEND THE PLAN TO CLIENTS!
}

ServerActionRouter.prototype.forceEnqueue = function(gameContext, actionIntent) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const executionPlan = actionQueue.createExecutionPlan(gameContext, actionIntent);

    if(!executionPlan) {
        return;
    }

    actionQueue.enqueue(executionPlan, Action.PRIORITY.HIGH);
    //SEND THE PLAN TO CLIENTS!
}