import { ActionRouter } from "../../../engine/action/actionRouter.js";
import { ACTION_TYPE, GAME_EVENT } from "../../enums.js";
import { packAttackIntent, packEndTurnIntent, packMoveIntent, packPurchaseIntent } from "../intentPacker.js";
import { unpackPlan } from "../planPacker.js";

export const ClientActionRouter = function() {
    ActionRouter.call(this);
}

ClientActionRouter.prototype = Object.create(ActionRouter.prototype);
ClientActionRouter.prototype.constructor = ClientActionRouter;

ClientActionRouter.prototype.packIntent = function(actionIntent) {
    const { type, data } = actionIntent;

    switch(type) {
        case ACTION_TYPE.PURCHASE_ENTITY: return packPurchaseIntent(data);
        case ACTION_TYPE.MOVE: return packMoveIntent(data);
        case ACTION_TYPE.ATTACK: return packAttackIntent(data);
        case ACTION_TYPE.END_TURN: return packEndTurnIntent(data);
        default: return null;
    }
}

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
            const packed = this.packIntent(actionIntent);

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

ClientActionRouter.prototype.onServerPlan = function(gameContext, buffer) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const executionPlan = unpackPlan(buffer);

    if(executionPlan.isValid()) {
        actionQueue.enqueue(executionPlan);
    } else {
        //...
    }
}
