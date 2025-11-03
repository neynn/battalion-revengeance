import { Action } from "../../engine/action/action.js";
import { ActionRequest } from "../../engine/action/actionRequest.js";
import { DialogueHandler } from "../dialogue/dialogueHandler.js";
import { TypeRegistry } from "../type/typeRegistry.js";

export const ActionHelper = {
    forceEnqueue: function(gameContext, request) {
        const { world } = gameContext;
        const { actionQueue } = world;
        const executionRequest = actionQueue.createExecutionRequest(gameContext, request);

        if(executionRequest) {
            actionQueue.enqueue(executionRequest, Action.PRIORITY.HIGH);
        }
    },
    createAttackRequest: function(entityID, targetID, command) {
        return new ActionRequest(TypeRegistry.ACTION_TYPE.ATTACK, {
            "entityID": entityID,
            "targetID": targetID,
            "command": command
        });
    },
    createMoveRequest: function(entityID, path, attackTarget) {
        return new ActionRequest(TypeRegistry.ACTION_TYPE.MOVE, {
            "entityID": entityID,
            "path": path,
            "attackTarget": attackTarget
        });
    },
    createCloakRequest: function(entityID) {
        return new ActionRequest(TypeRegistry.ACTION_TYPE.CLOAK, {
            "entityID": entityID
        });
    },
    createUncloakRequest: function(entities) {
        return new ActionRequest(TypeRegistry.ACTION_TYPE.UNCLOAK, {
            "entities": entities
        });
    },
    createDialogueRequest: function(type, dialogue = null) {
        return new ActionRequest(TypeRegistry.ACTION_TYPE.DIALOGUE, {
            "type": type,
            "dialogue": dialogue
        });
    },
    createDeathRequest: function(gameContext, entities) {
        return new ActionRequest(TypeRegistry.ACTION_TYPE.DEATH, {
            "entities": entities
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