import { Action } from "../action/action.js";
import { ActionRouter } from "./actionRouter.js";

export const ClientActionRouter = function() {
    ActionRouter.call(this);

    this.target = ClientActionRouter.TARGET.CLIENT;
}

ClientActionRouter.TARGET = {
    CLIENT: 0,
    SERVER: 1
};

ClientActionRouter.prototype = Object.create(ActionRouter.prototype);
ClientActionRouter.prototype.constructor = ClientActionRouter;

ClientActionRouter.prototype.dispatch = function(gameContext, executionPlan) {
    const { world, client } = gameContext;
    const { actionQueue } = world;
    const { socket } = client;

    switch(this.target) {
        case ClientActionRouter.TARGET.CLIENT: {
            actionQueue.enqueue(executionPlan);
            break;
        }
        case ClientActionRouter.TARGET.SERVER: {
            const { type, intent } = executionPlan;

            if(this.sendableActions.has(type)) {
                const json = intent.toJSON();
            }

            break;
        }
    }
}

ClientActionRouter.prototype.forceEnqueue = function(gameContext, actionIntent) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const executionPlan = actionQueue.createExecutionPlan(gameContext, actionIntent);

    if(!executionPlan) {
        return;
    }

    switch(this.target) {
        case ClientActionRouter.TARGET.CLIENT: {
            actionQueue.enqueue(executionPlan, Action.PRIORITY.HIGH);
            break;
        }
        case ClientActionRouter.TARGET.SERVER: {
            //IGNORE SELF ENQUEUES.
            break;
        }
    }
}