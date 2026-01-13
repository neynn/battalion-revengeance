import { ACTION_TYPE, GAME_EVENT } from "../../src/enums.js";
import { ActionIntent } from "../action/actionIntent.js";
import { ExecutionPlan } from "../action/executionPlan.js";
import { ActionRouter } from "./actionRouter.js";

export const ClientActionRouter = function() {
    ActionRouter.call(this);

    this.target = ClientActionRouter.TARGET.CLIENT;
    this.sendable = new Set();
    this.sendable.add(ACTION_TYPE.PURCHASE_ENTITY);
    this.sendable.add(ACTION_TYPE.MOVE);
    this.sendable.add(ACTION_TYPE.ATTACK);
    this.sendable.add(ACTION_TYPE.END_TURN);
}

ClientActionRouter.TARGET = {
    CLIENT: 0,
    SERVER: 1
};

ClientActionRouter.prototype = Object.create(ActionRouter.prototype);
ClientActionRouter.prototype.constructor = ClientActionRouter;

ClientActionRouter.prototype.toClient = function() {
    this.target = ClientActionRouter.TARGET.CLIENT;
}

ClientActionRouter.prototype.toServer = function() {
    this.target = ClientActionRouter.TARGET.SERVER;
}

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

            if(this.sendable.has(type)) {
                socket.messageRoom(GAME_EVENT.MP_CLIENT_ACTION_INTENT, {
                    "intent": intent.toJSON()
                });
            }

            break;
        }
    }
}

ClientActionRouter.prototype.forceEnqueue = function(gameContext, actionIntent) {
    if(this.target === ClientActionRouter.TARGET.SERVER) {
        return;
    }

    const { world } = gameContext;
    const { actionQueue } = world;
    const executionPlan = actionQueue.createExecutionPlan(gameContext, actionIntent);

    if(!executionPlan) {
        return;
    }

    switch(this.target) {
        case ClientActionRouter.TARGET.CLIENT: {
            actionQueue.enqueue(executionPlan);
            break;
        }
        case ClientActionRouter.TARGET.SERVER: {
            //IGNORE SELF ENQUEUES.
            break;
        }
    }
}

ClientActionRouter.prototype.onServerPlan = function(gameContext, plan) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const { intent } = plan;
    const { type, data } = intent;
    const actionIntent = new ActionIntent(type, data);
    const executionPlan = new ExecutionPlan(-1, type, actionIntent);

    executionPlan.setData(plan.data);
    actionQueue.enqueue(executionPlan);
}
