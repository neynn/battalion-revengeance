import { ActionIntent } from "../../engine/action/actionIntent.js";
import { DialogueHandler } from "../dialogue/dialogueHandler.js";
import { COMMAND_TYPE } from "../enums.js";
import { TypeRegistry } from "../type/typeRegistry.js";

export const createEndTurnIntent = function(actorID) {
    return new ActionIntent(TypeRegistry.ACTION_TYPE.END_TURN, {
        "actorID": actorID
    });
}

export const createCaptureIntent = function(entityID, targetX, targetY) {
    return new ActionIntent(TypeRegistry.ACTION_TYPE.CAPTURE, {
        "entityID": entityID,
        "targetX": targetX,
        "targetY": targetY
    });
}

export const createTrackingIntent = function(entityID, potentialTargets) {
    return new ActionIntent(TypeRegistry.ACTION_TYPE.ATTACK, {
        "entityID": entityID,
        "targetID": potentialTargets[0].getID(), //TODO: Custom logic like "only targetable" and "weakest".
        "command": COMMAND_TYPE.CHAIN_AFTER_MOVE
    });
}

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
    createDeathRequest: function(gameContext, entities) {
        return new ActionIntent(TypeRegistry.ACTION_TYPE.DEATH, {
            "entities": entities
        });
    }
};