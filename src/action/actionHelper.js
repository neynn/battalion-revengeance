import { ActionRequest } from "../../engine/action/actionRequest.js";
import { DialogueHandler } from "../dialogue/dialogueHandler.js";
import { TypeRegistry } from "../type/typeRegistry.js";

export const ActionHelper = {
    createAttackRequest: function(entityID, targetID, attackType) {
        return new ActionRequest(TypeRegistry.ACTION_TYPE.ATTACK, {
            "entityID": entityID,
            "targetID": targetID,
            "attackType": attackType
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
    },
    createDialogueRequest: function(type, dialogue = null) {
        return new ActionRequest(TypeRegistry.ACTION_TYPE.DIALOGUE, {
            "type": type,
            "dialogue": dialogue
        });
    },
    createCustomDialogue: function(gameContext, dialogue = null) {
        const { world } =  gameContext;
        const { actionQueue } = world;

        const request = ActionHelper.createDialogueRequest(DialogueHandler.TYPE.CUSTOM, dialogue);
        const execution = actionQueue.createExecutionRequest(gameContext, request);

        if(execution) {
            actionQueue.enqueue(execution);
        }
    },
    createRegularDialogue: function(gameContext, type) {
        const { world } =  gameContext;
        const { actionQueue } = world;

        const request = ActionHelper.createDialogueRequest(type);
        const execution = actionQueue.createExecutionRequest(gameContext, request);

        if(execution) {
            actionQueue.enqueue(execution);
        } 
    }
};