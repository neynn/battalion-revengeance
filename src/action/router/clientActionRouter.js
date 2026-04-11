import { ActionRouter } from "../../../engine/action/actionRouter.js";
import { GAME_EVENT } from "../../enums.js";
import { packIntent } from "../intentPacker.js";

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
            const packed = packIntent(actionIntent);

            if(packed) {
                socket.messageRoom(GAME_EVENT.MP_CLIENT_ACTION_INTENT, packed);
            } else {
                console.log("Unsupported ActionType!");
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