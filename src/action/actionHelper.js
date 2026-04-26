import { ActionIntent } from "../../engine/action/actionIntent.js";
import { ACTION_TYPE, COMMAND_TYPE } from "../enums.js";

export const createInterruptIntent = function(type, event) {
    return new ActionIntent(ACTION_TYPE.INTERRUPT, {
        "type": type,
        "event": event
    });
}

export const createMineTriggerIntent = function(entityID) {
    return new ActionIntent(ACTION_TYPE.MINE_TRIGGER, {
        "entityID": entityID
    });
}

export const createProduceIntent = function(entityID, typeID, direction) {
    return new ActionIntent(ACTION_TYPE.PRODUCE_ENTITY, {
        "entityID": entityID,
        "typeID": typeID,
        "direction": direction
    });
} 

export const createPurchaseIntent = function(tileX, tileY, typeID) {
    return new ActionIntent(ACTION_TYPE.PURCHASE_ENTITY, {
        "tileX": tileX,
        "tileY": tileY,
        "typeID": typeID
    });
}

export const createExtractIntent = function(entityID) {
    return new ActionIntent(ACTION_TYPE.EXTRACT, {
        "entityID": entityID
    });
}

export const createSpawnIntent = function(snapshot) {
    return new ActionIntent(ACTION_TYPE.ENTITY_SPAWN, {
        "snapshot": snapshot
    });
}

export const createStartTurnIntent = function() {
    return new ActionIntent(ACTION_TYPE.START_TURN, {

    });
}

export const createTileExplodeIntent = function(layerID, tileX, tileY) {
    return new ActionIntent(ACTION_TYPE.EXPLODE_TILE, {
        "layerID": layerID,
        "tileX": tileX,
        "tileY": tileY
    });
}

export const createEndTurnIntent = function() {
    return new ActionIntent(ACTION_TYPE.END_TURN, {});
}

export const createHealRequest = function(entityID, targetID) {
    return new ActionIntent(ACTION_TYPE.HEAL, {
        "entityID": entityID,
        "targetID": targetID
    });
}

export const createMoveRequest = function(entityID, path, command, targetID) {
    return new ActionIntent(ACTION_TYPE.MOVE, {
        "entityID": entityID,
        "path": path,
        "command": command,
        "targetID": targetID
    });
}

export const createCloakIntent = function(entityID) {
    return new ActionIntent(ACTION_TYPE.CLOAK, {
        "entityID": entityID
    });
}

export const createUncloakIntent = function(entityID) {
    return new ActionIntent(ACTION_TYPE.UNCLOAK, {
        "entityID": entityID
    });
}

export const createDeathIntent = function(entities) {
    return new ActionIntent(ACTION_TYPE.DEATH, {
        "entities": entities
    });
}