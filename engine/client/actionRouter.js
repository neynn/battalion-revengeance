import { Action } from "../action/action.js";

export const ActionRouter = function() {
    this.target = ActionRouter.TARGET.CLIENT;
    this.sendable = new Set();
    this.receivable = new Set();
}

ActionRouter.TARGET = {
    CLIENT: 0,
    SERVER: 1
};

ActionRouter.prototype.dispatch = function(gameContext, executionPlan) {
    const { world, client } = gameContext;
    const { actionQueue } = world;
    const { socket } = client;

    switch(this.target) {
        case ActionRouter.TARGET.CLIENT: {
            actionQueue.enqueue(executionPlan);
            break;
        }
        case ActionRouter.TARGET.SERVER: {
            const { type, intent } = executionPlan;

            if(this.sendableActions.has(type)) {
                const json = intent.toJSON();
            }

            //TODO: Make JSO N out of INTENT and send it to the server.
            break;
        }
    }
}

ActionRouter.prototype.forceEnqueue = function(gameContext, actionIntent) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const executionPlan = actionQueue.createExecutionPlan(gameContext, actionIntent);

    if(!executionPlan) {
        return;
    }

    switch(this.target) {
        case ActionRouter.TARGET.CLIENT: {
            actionQueue.enqueue(executionPlan, Action.PRIORITY.HIGH);
            break;
        }
    }
}