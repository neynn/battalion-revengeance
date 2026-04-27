import { ActionIntent } from "../../engine/action/actionIntent.js";
import { ACTION_TYPE, COMMAND_TYPE } from "../enums.js";

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

export const createStartTurnIntent = function() {
    return new ActionIntent(ACTION_TYPE.START_TURN, {

    });
}

export const createUncloakIntent = function(entityID) {
    return new ActionIntent(ACTION_TYPE.UNCLOAK, {
        "entityID": entityID
    });
}