import { ActionRequest } from "../../engine/action/actionRequest.js";
import { TypeRegistry } from "../type/typeRegistry.js";

export const ActionHelper = {
    tryEnqueueRequest: function(gameContext, actorID, request) {
        const { world } = gameContext;
        const { actionQueue, turnManager } = world;

        if(!actionQueue.isRunning()) {
            if(turnManager.isActor(actorID)) {
                const executionRequest = actionQueue.createExecutionRequest(gameContext, request);

                if(executionRequest) {
                    executionRequest.setActor(actorID);
                    actionQueue.enqueue(executionRequest);
                }
            }
        }
    },
    createAttackRequest: function(entityID, targetID) {
        return new ActionRequest(TypeRegistry.ACTION_TYPE.ATTACK, {
            "entityID": entityID,
            "targetID": targetID
        });
    },
    createMoveRequest: function(entityID, targetX, targetY) {
        return new ActionRequest(TypeRegistry.ACTION_TYPE.MOVE, {
            "entityID": entityID,
            "targetX": targetX,
            "targetY": targetY
        });
    },
    createCloakRequest: function(entityID) {
        return new ActionRequest(TypeRegistry.ACTION_TYPE.CLOAK, {
            "entityID": entityID
        });
    }
};