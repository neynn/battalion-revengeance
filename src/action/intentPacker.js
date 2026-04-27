import { ACTION_TYPE, COMMAND_TYPE } from "../enums.js";
import { createStep } from "../systems/pathfinding.js";
import { createMoveRequest, createProduceIntent, createPurchaseIntent } from "./actionHelper.js";
import { MOVE_STEP_SIZE, packStep, unpackStep } from "./packer_constants.js";
import { AttackActionVTable } from "./types/attack.js";
import { EndTurnVTable } from "./types/endTurn.js";
import { HealVTable } from "./types/heal.js";

/*
    0x00 -> type,
    0x01 -> direction,
    0x02 -> entityID,
    0x04 -> typeID
*/
const PRODUCE_HEADER_SIZE = 6;

const packProduceIntent = function(data) {
    const { direction, entityID, typeID } = data;
    const buffer = new ArrayBuffer(PRODUCE_HEADER_SIZE);
    const view = new DataView(buffer);

    view.setUint8(0, ACTION_TYPE.PRODUCE_ENTITY);
    view.setUint8(1, direction);
    view.setInt16(2, entityID, true);
    view.setInt16(4, typeID, true);

    return buffer;
}

/*
    0x00 -> type,
    0x01 -> entityID,
    0x03 -> targetID
*/
const HEAL_HEADER_SIZE = 5;

const packHealIntent = function(data) {
    const { entityID, targetID } = data;
    const buffer = new ArrayBuffer(HEAL_HEADER_SIZE);
    const view = new DataView(buffer);

    view.setUint8(0, ACTION_TYPE.HEAL);
    view.setInt16(1, entityID, true);
    view.setInt16(3, targetID, true);

    return buffer;
}

/*
    0x00 -> type
    0x01 -> typeID
    0x03 -> tileX
    0x05 -> tileY
*/
const PURCHASE_HEADER_SIZE = 7;

const packPurchaseIntent = function(data) {
    const { tileX, tileY, typeID } = data;
    const buffer = new ArrayBuffer(PURCHASE_HEADER_SIZE);
    const view = new DataView(buffer);

    view.setUint8(0, ACTION_TYPE.PURCHASE_ENTITY);
    view.setInt16(1, typeID, true);
    view.setInt16(3, tileX, true);
    view.setInt16(5, tileY, true);

    return buffer; 
}

/*
    0x00 -> type
*/
const END_TURN_HEADER_SIZE = 1;

const packEndTurnIntent = function(data) {
    const buffer = new ArrayBuffer(END_TURN_HEADER_SIZE);
    const view = new DataView(buffer);

    view.setUint8(0, ACTION_TYPE.END_TURN);

    return buffer; 
}

/*
    0x00 -> type
    0x01 -> entityID
    0x03 -> targetID
    0x05 -> command
*/
const ATTACK_HEADER_SIZE = 6;

const packAttackIntent = function(data) {
    const { entityID, targetID, command } = data;
    const buffer = new ArrayBuffer(ATTACK_HEADER_SIZE);
    const view = new DataView(buffer);

    view.setUint8(0, ACTION_TYPE.ATTACK);
    view.setInt16(1, entityID, true);
    view.setInt16(3, targetID, true);
    view.setUint8(5, command);

    return buffer;
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

const packMoveIntent = function(data) {
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
}

export const isIntentValid = function(gameContext, intent) {
    const { world, teamManager } = gameContext;
    const { currentTeam } = teamManager;
    const { entityManager } = world;
    const { type, data } = intent;

    switch(type) {
        case ACTION_TYPE.PRODUCE_ENTITY: {
            return true;
        }
        case ACTION_TYPE.PURCHASE_ENTITY: {
            return true;
        }
        case ACTION_TYPE.END_TURN: {
            return true;
        }
        case ACTION_TYPE.HEAL: {
            const { entityID } = data;
            const entity = entityManager.getEntity(entityID);

            return entity && entity.belongsTo(currentTeam);
        }
        case ACTION_TYPE.ATTACK: {
            const { entityID, command } = data;
            const entity = entityManager.getEntity(entityID);

            return command === COMMAND_TYPE.ATTACK && entity && entity.belongsTo(currentTeam);
        }
        case ACTION_TYPE.MOVE: {
            const { entityID } = data;
            const entity = entityManager.getEntity(entityID);

            return entity && entity.belongsTo(currentTeam);
        }
        default: {
            return false;
        }
    }
}

export const packIntent = function(actionIntent) {
    const { type, data } = actionIntent;

    switch(type) {
        case ACTION_TYPE.PRODUCE_ENTITY: return packProduceIntent(data);
        case ACTION_TYPE.PURCHASE_ENTITY: return packPurchaseIntent(data);
        case ACTION_TYPE.MOVE: return packMoveIntent(data);
        case ACTION_TYPE.HEAL: return packHealIntent(data);
        case ACTION_TYPE.ATTACK: return packAttackIntent(data);
        case ACTION_TYPE.END_TURN: return packEndTurnIntent(data);
        default: return null;
    }
}

export const unpackIntent = function(data) {
    const view = new DataView(data);
    const type = view.getUint8(0);

    switch(type) {
        case ACTION_TYPE.PRODUCE_ENTITY: {
            const direction = view.getUint8(1);
            const entityID = view.getInt16(2, true);
            const typeID = view.getInt16(4, true);

            return createProduceIntent(entityID, typeID, direction);
        }
        case ACTION_TYPE.PURCHASE_ENTITY: {
            const typeID = view.getInt16(1, true);
            const tileX = view.getInt16(3, true);
            const tileY = view.getInt16(5, true);

            return createPurchaseIntent(tileX, tileY, typeID);
        }
        case ACTION_TYPE.END_TURN: {
            return EndTurnVTable.createIntent();
        }
        case ACTION_TYPE.HEAL: {
            const entityID = view.getInt16(1, true);
            const targetID = view.getInt16(3, true);

            return HealVTable.createIntent(entityID, targetID);
        }
        case ACTION_TYPE.ATTACK: {
            const entityID = view.getInt16(1, true);
            const targetID = view.getInt16(3, true);
            const command = view.getUint8(5);

            return AttackActionVTable.createIntent(entityID, targetID, command);
        }
        case ACTION_TYPE.MOVE: {
            const command = view.getUint8(1);
            const entityID = view.getInt16(2, true);
            const targetID = view.getInt16(4, true);
            const pathLength = view.getUint16(6, true);
            const path = [];
            let byteOffset = MOVE_HEADER_SIZE;

            for(let i = 0; i < pathLength; i++) {
                const step = createStep(0, 0);

                path.push(step);
                byteOffset = unpackStep(step, view, byteOffset);
            }

            return createMoveRequest(entityID, path, command, targetID);
        }
    }

    return null;
}