import { ExecutionPlan } from "../../engine/action/executionPlan.js";
import { ActionRouter } from "../../engine/action/actionRouter.js";
import { ACTION_TYPE, GAME_EVENT } from "../enums.js";

export const ClientActionRouter = function() {
    ActionRouter.call(this);
}

ClientActionRouter.prototype = Object.create(ActionRouter.prototype);
ClientActionRouter.prototype.constructor = ClientActionRouter;

ClientActionRouter.prototype.dispatch = function(gameContext, executionPlan, actionIntent) {
    const { world, client } = gameContext;
    const { actionQueue } = world;
    const { socket } = client;

    switch(this.target) {
        case ActionRouter.TARGET.SELF: {
            actionQueue.enqueue(executionPlan);
            break;
        }
        case ActionRouter.TARGET.OTHER: {
            const { type } = executionPlan;

            switch(type) {
                case ACTION_TYPE.PURCHASE_ENTITY:
                case ACTION_TYPE.MOVE:
                case ACTION_TYPE.ATTACK:
                case ACTION_TYPE.END_TURN: {
                    socket.messageRoom(GAME_EVENT.MP_CLIENT_ACTION_INTENT, actionIntent.toJSON());
                    break;
                }
                default: {
                    console.log("Unsupported ActionType!");
                    break;
                }
            }

            break;
        }
    }
}

ClientActionRouter.prototype.forceEnqueue = function(gameContext, actionIntent) {
    const { world } = gameContext;
    const { actionQueue } = world;

    switch(this.target) {
        case ActionRouter.TARGET.SELF: {
            const executionPlan = actionQueue.createExecutionPlan(gameContext, actionIntent);

            if(executionPlan) {
                actionQueue.enqueue(executionPlan);
            }

            break;
        }
        default: {
            break;
        }
    }
}

ClientActionRouter.prototype.onServerPlan = function(gameContext, planJSON) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const { id, type, data } = planJSON;
    const executionPlan = new ExecutionPlan(id, type);

    executionPlan.setData(data);
    actionQueue.enqueue(executionPlan);
}
