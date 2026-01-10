import { ActionIntent } from "../../engine/action/actionIntent.js";
import { COMMAND_TYPE } from "../enums.js";
import { TypeRegistry } from "../type/typeRegistry.js";

export const createStartTurnIntent = function() {
    return new ActionIntent(TypeRegistry.ACTION_TYPE.START_TURN, {

    });
}

export const createTileExplodeIntent = function(layerID, tileX, tileY) {
    return new ActionIntent(TypeRegistry.ACTION_TYPE.EXPLODE_TILE, {
        "layerID": layerID,
        "tileX": tileX,
        "tileY": tileY
    });
}

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

export const createTrackingIntent = function(entity, potentialTargets) {
    const entityID = entity.getID();
    const targetID = potentialTargets[0].getID();
    
    return new ActionIntent(TypeRegistry.ACTION_TYPE.ATTACK, {
        "entityID": entityID,
        "targetID": targetID,
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

export const createCloakIntent = function(entityID) {
    return new ActionIntent(TypeRegistry.ACTION_TYPE.CLOAK, {
        "entityID": entityID
    });
}

export const createUncloakIntent = function(entities) {
    return new ActionIntent(TypeRegistry.ACTION_TYPE.UNCLOAK, {
        "entities": entities
    });
}

export const createDeathIntent = function(entities) {
    return new ActionIntent(TypeRegistry.ACTION_TYPE.DEATH, {
        "entities": entities
    });
}