import { ACTION_TYPE, ATTACK_COMMAND_TYPE, HEAL_COMMAND_TYPE } from "../enums.js";
import { createStep } from "../systems/pathfinding.js";
import { MOVE_STEP_SIZE, packStep, unpackStep } from "./packer_constants.js";
import { AttackActionVTable } from "./types/attack.js";
import { EndTurnVTable } from "./types/endTurn.js";
import { FromTransportVTable } from "./types/fromTransport.js";
import { HealVTable } from "./types/heal.js";
import { MoveVTable } from "./types/move.js";
import { ProduceVTable } from "./types/produceEntity.js";
import { PurchaseVTable } from "./types/purchaseEntity.js";
import { ToTransportVTable } from "./types/toTransport.js";

/**
 * 0x00 [U8] -> type
 * 
 * 0x01 [S16] -> entityID
 */
const FROM_TRANSPORT_HEADER_SIZE = 3;

const FromTransportTable = {
    /**
     * 
     * @param {*} gameContext 
     * @param {*} data 
     * @returns {boolean}
     */
    isValid: function(gameContext, data) {
        const { world, teamManager } = gameContext;
        const { currentTeam } = teamManager;
        const { entityManager } = world;
        const { entityID } = data;
        const entity = entityManager.getEntity(entityID);

        return entity && entity.belongsTo(currentTeam);
    },
    write: function(data) {
        const { entityID } = data;
        const buffer = new ArrayBuffer(FROM_TRANSPORT_HEADER_SIZE)
        const view = new DataView(buffer);

        view.setUint8(0, ACTION_TYPE.FROM_TRANSPORT);
        view.setInt16(1, entityID, true);

        return buffer;
    },
    read: function(view) {
        const entityID = view.getInt16(1, true);

        return FromTransportVTable.createIntent(entityID);
    }
}

/**
 * 0x00 [U8] -> type
 * 
 * 0x01 [U8] -> transportID
 * 
 * 0x02 [S16] -> entityID
 */
const TO_TRANSPORT_HEADER_SIZE = 4;

const ToTransportTable = {
    /**
     * 
     * @param {*} gameContext 
     * @param {*} data 
     * @returns {boolean}
     */
    isValid: function(gameContext, data) {
        const { world, teamManager } = gameContext;
        const { currentTeam } = teamManager;
        const { entityManager } = world;
        const { entityID } = data;
        const entity = entityManager.getEntity(entityID);

        return entity && entity.belongsTo(currentTeam);
    },
    write: function(data) {
        const { entityID, transportID } = data;
        const buffer = new ArrayBuffer(TO_TRANSPORT_HEADER_SIZE)
        const view = new DataView(buffer);

        view.setUint8(0, ACTION_TYPE.TO_TRANSPORT);
        view.setUint8(1, transportID);
        view.setInt16(2, entityID, true);

        return buffer;
    },
    read: function(view) {
        const transportID = view.getUint8(1);
        const entityID = view.getInt16(2, true);

        return ToTransportVTable.createIntent(entityID, transportID);
    }
}

/*
    0x00 -> type,
    0x01 -> direction,
    0x02 -> entityID,
    0x04 -> typeID
*/
const PRODUCE_HEADER_SIZE = 6;

const ProduceTable = {
    isValid: function(gameContext, data) {
        return true;
    },
    write: function(data) {
        const { direction, entityID, typeID } = data;
        const buffer = new ArrayBuffer(PRODUCE_HEADER_SIZE);
        const view = new DataView(buffer);

        view.setUint8(0, ACTION_TYPE.PRODUCE_ENTITY);
        view.setUint8(1, direction);
        view.setInt16(2, entityID, true);
        view.setInt16(4, typeID, true);

        return buffer;
    },
    read: function(view) {
        const direction = view.getUint8(1);
        const entityID = view.getInt16(2, true);
        const typeID = view.getInt16(4, true);

        return ProduceVTable.createIntent(entityID, typeID, direction);
    }
}

/*
    0x00 -> type,
    0x01 -> entityID,
    0x03 -> targetID,
    0x05 -> commandID
*/
const HEAL_HEADER_SIZE = 6;

const HealTable = {
    /**
     * 
     * @param {*} gameContext 
     * @param {*} data 
     * @returns {boolean}
     */
    isValid: function(gameContext, data) {
        const { world, teamManager } = gameContext;
        const { currentTeam } = teamManager;
        const { entityManager } = world;
        const { entityID, commandID } = data;
        const entity = entityManager.getEntity(entityID);

        return commandID === HEAL_COMMAND_TYPE.DIRECT && entity && entity.belongsTo(currentTeam);
    },
    write: function(data) {
        const { entityID, targetID, commandID } = data;
        const buffer = new ArrayBuffer(HEAL_HEADER_SIZE);
        const view = new DataView(buffer);

        view.setUint8(0, ACTION_TYPE.HEAL);
        view.setInt16(1, entityID, true);
        view.setInt16(3, targetID, true);
        view.setUint8(5, commandID)

        return buffer;
    },
    read: function(view) {
        const entityID = view.getInt16(1, true);
        const targetID = view.getInt16(3, true);
        const commandID = view.getUint8(5);

        return HealVTable.createIntent(entityID, targetID, commandID);
    }
}

/*
    0x00 -> type
    0x01 -> typeID
    0x03 -> tileX
    0x05 -> tileY
*/
const PURCHASE_HEADER_SIZE = 7;

const PurchaseTable = {
    isValid: function(gameContext, data) {
        return true;
    },
    write: function(data) {
        const { tileX, tileY, typeID } = data;
        const buffer = new ArrayBuffer(PURCHASE_HEADER_SIZE);
        const view = new DataView(buffer);

        view.setUint8(0, ACTION_TYPE.PURCHASE_ENTITY);
        view.setInt16(1, typeID, true);
        view.setInt16(3, tileX, true);
        view.setInt16(5, tileY, true);

        return buffer; 
    },
    read: function(view) {
        const typeID = view.getInt16(1, true);
        const tileX = view.getInt16(3, true);
        const tileY = view.getInt16(5, true);

        return PurchaseVTable.createIntent(tileX, tileY, typeID);
    }
}


/*
    0x00 -> type
*/
const END_TURN_HEADER_SIZE = 1;

const EndTurnTable = {
    isValid: function(gameContext, data) {
        return true;
    },
    write: function(data) {
        const buffer = new ArrayBuffer(END_TURN_HEADER_SIZE);
        const view = new DataView(buffer);

        view.setUint8(0, ACTION_TYPE.END_TURN);

        return buffer; 
    },
    read: function(view) {
        return EndTurnVTable.createIntent();
    }
}


/*
    0x00 -> type
    0x01 -> entityID
    0x03 -> targetID
    0x05 -> command
*/
const ATTACK_HEADER_SIZE = 6;

const AttackTable = {
    /**
     * 
     * @param {*} gameContext 
     * @param {*} data 
     * @returns {boolean}
     */
    isValid: function(gameContext, data) {
        const { world, teamManager } = gameContext;
        const { currentTeam } = teamManager;
        const { entityManager } = world;
        const { entityID, command } = data;
        const entity = entityManager.getEntity(entityID);

        return command === ATTACK_COMMAND_TYPE.DIRECT && entity && entity.belongsTo(currentTeam);
    },
    write: function(data) {
        const { entityID, targetID, command } = data;
        const buffer = new ArrayBuffer(ATTACK_HEADER_SIZE);
        const view = new DataView(buffer);

        view.setUint8(0, ACTION_TYPE.ATTACK);
        view.setInt16(1, entityID, true);
        view.setInt16(3, targetID, true);
        view.setUint8(5, command);

        return buffer;
    },
    read: function(view) {
        const entityID = view.getInt16(1, true);
        const targetID = view.getInt16(3, true);
        const command = view.getUint8(5);

        return AttackActionVTable.createIntent(entityID, targetID, command);
    }
}

/*
    0x00 -> type
    0x01 -> command
    0x02 -> entityID
    0x04 -> targetID
    0x06 -> path length
    0x08 -> path [deltaX, deltaY, tileX, tileY]
*/
const MOVE_HEADER_SIZE = 8;

const MoveTable = {
    /**
     * 
     * @param {*} gameContext 
     * @param {*} data 
     * @returns {boolean}
     */
    isValid: function(gameContext, data) {
        const { world, teamManager } = gameContext;
        const { currentTeam } = teamManager;
        const { entityManager } = world;
        const { entityID } = data;
        const entity = entityManager.getEntity(entityID);

        return entity && entity.belongsTo(currentTeam);
    },
    write: function(data) {
        const { entityID, targetID, command, path } = data;
        const BUFFER_SIZE = MOVE_HEADER_SIZE + MOVE_STEP_SIZE * path.length;
        const buffer = new ArrayBuffer(BUFFER_SIZE);
        const view = new DataView(buffer);

        view.setUint8(0, ACTION_TYPE.MOVE);
        view.setUint8(1, command);
        view.setInt16(2, entityID, true);
        view.setInt16(4, targetID, true);
        view.setUint16(6, path.length, true);

        let byteOffset = MOVE_HEADER_SIZE;

        for(let i = 0; i < path.length; i++) {
            byteOffset = packStep(path[i], view, byteOffset);
        }

        return buffer;
    },
    read: function(view) {
        const command = view.getUint8(1);
        const entityID = view.getInt16(2, true);
        const targetID = view.getInt16(4, true);
        const pathLength = view.getUint16(6, true);
        const path = [];
        let byteOffset = MOVE_HEADER_SIZE;

        for(let i = 0; i < pathLength; i++) {
            const step = createStep();

            path.push(step);
            byteOffset = unpackStep(step, view, byteOffset);
        }

        return MoveVTable.createIntent(entityID, path, command, targetID);
    }
}

const getTable = function(actionType) {
    switch(actionType) {
        case ACTION_TYPE.MOVE: return MoveTable;
        case ACTION_TYPE.ATTACK: return AttackTable;
        case ACTION_TYPE.END_TURN: return EndTurnTable;
        case ACTION_TYPE.PURCHASE_ENTITY: return PurchaseTable;
        case ACTION_TYPE.HEAL: return HealTable;
        case ACTION_TYPE.PRODUCE_ENTITY: return ProduceTable;
        case ACTION_TYPE.TO_TRANSPORT: return ToTransportTable;
        case ACTION_TYPE.FROM_TRANSPORT: return FromTransportTable;
        default: return null;
    }
}

export const isIntentValid = function(gameContext, intent) {
    const { type, data } = intent;
    const table = getTable(type);

    if(!table) {
        return false;
    }

    return table.isValid(gameContext, data);
}

export const packIntent = function(actionIntent) {
    const { type, data } = actionIntent;
    const table = getTable(type);

    if(!table) {
        return null;
    }

    return table.write(data);
}

export const unpackIntent = function(data) {
    const view = new DataView(data);
    const type = view.getUint8(0);
    const table = getTable(type);

    if(!table) {
        return null;
    }

    return table.read(view);
}