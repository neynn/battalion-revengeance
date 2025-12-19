import { Action } from "../../engine/action/action.js";
import { ActionIntent } from "../../engine/action/actionIntent.js";
import { DialogueHandler } from "../dialogue/dialogueHandler.js";
import { TypeRegistry } from "../type/typeRegistry.js";

export const createHealRequest = function(entityID, targetID, command) {
    return new ActionIntent(TypeRegistry.ACTION_TYPE.HEAL, {
        "entityID": entityID,
        "targetID": targetID,
        "command": command
    });
}

export const createAttackRequest = function(entityID, targetID, command) {
    return new ActionIntent(TypeRegistry.ACTION_TYPE.ATTACK, {
        "entityID": entityID,
        "targetID": targetID,
        "command": command
    });
}

export const createMoveRequest = function(entityID, path, targetID) {
    return new ActionIntent(TypeRegistry.ACTION_TYPE.MOVE, {
        "entityID": entityID,
        "path": path,
        "targetID": targetID
    });
}

export const ActionHelper = {
    createCloakRequest: function(entityID) {
        return new ActionIntent(TypeRegistry.ACTION_TYPE.CLOAK, {
            "entityID": entityID
        });
    },
    createUncloakRequest: function(entities) {
        return new ActionIntent(TypeRegistry.ACTION_TYPE.UNCLOAK, {
            "entities": entities
        });
    },
    createDialogueRequest: function(type, dialogue = null) {
        return new ActionIntent(TypeRegistry.ACTION_TYPE.DIALOGUE, {
            "type": type,
            "dialogue": dialogue
        });
    },
    createDeathRequest: function(gameContext, entities) {
        return new ActionIntent(TypeRegistry.ACTION_TYPE.DEATH, {
            "entities": entities
        });
    },
    createCustomDialogue: function(gameContext, dialogue = null) {
        const { world } =  gameContext;
        const { actionQueue } = world;

        const request = ActionHelper.createDialogueRequest(DialogueHandler.TYPE.CUSTOM, dialogue);
        const execution = actionQueue.createExecutionPlan(gameContext, request);

        if(execution) {
            actionQueue.enqueue(execution);
        }
    },
    createRegularDialogue: function(gameContext, type) {
        const { world } =  gameContext;
        const { actionQueue } = world;

        const request = ActionHelper.createDialogueRequest(type);
        const execution = actionQueue.createExecutionPlan(gameContext, request);

        if(execution) {
            actionQueue.enqueue(execution);
        } 
    },
    createEndTurnRequest: function(actorID) {
        return new ActionIntent(TypeRegistry.ACTION_TYPE.END_TURN, {
            "actorID": actorID
        });
    }
};