import { ACTION_TYPE } from "../enums.js";
import { createStep } from "../systems/pathfinding.js";
import { createAttackRequest, createEndTurnIntent, createMoveRequest, createPurchseEntityIntent } from "./actionHelper.js";

/*
    0x00 -> type
    0x01 -> typeID
    0x03 -> tileX
    0x05 -> tileY
*/
const PURCHASE_HEADER_SIZE = 7;

export const packPurchaseIntent = function(data) {
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

export const packEndTurnIntent = function(data) {
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

export const packAttackIntent = function(data) {
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
const MOVE_STEP_SIZE = 8;

export const packMoveIntent = function(data) {
    const { entityID, targetID, command, path } = data;
    const BUFFER_SIZE = MOVE_HEADER_SIZE + MOVE_STEP_SIZE * path.length;
    const buffer = new ArrayBuffer(BUFFER_SIZE);
    const view = new DataView(buffer);

    view.setUint8(0, ACTION_TYPE.MOVE);
    view.setUint8(1, command, true);
    view.setInt16(2, entityID, true);
    view.setInt16(4, targetID, true);
    view.setUint16(6, path.length, true);

    let byteOffset = MOVE_HEADER_SIZE;

    for(let i = 0; i < path.length; i++) {
        const { deltaX, deltaY, tileX, tileY } = path[i];

        view.setInt16(byteOffset, deltaX, true);
        view.setInt16(byteOffset + 2, deltaY, true);
        view.setInt16(byteOffset + 4, tileX, true);
        view.setInt16(byteOffset + 6, tileY, true);

        byteOffset += MOVE_STEP_SIZE;
    }

    return buffer;
}

export const unpackIntent = function(data) {
    const view = new DataView(data);
    const type = view.getUint8(0);

    switch(type) {
        case ACTION_TYPE.PURCHASE_ENTITY: {
            const typeID = view.getInt16(1, true);
            const tileX = view.getInt16(3, true);
            const tileY = view.getInt16(5, true);

            return createPurchseEntityIntent(tileX, tileY, typeID);
        }
        case ACTION_TYPE.END_TURN: {
            return createEndTurnIntent();
        }
        case ACTION_TYPE.ATTACK: {
            const entityID = view.getInt16(1, true);
            const targetID = view.getInt16(3, true);
            const command = view.getUint8(5);

            return createAttackRequest(entityID, targetID, command);
        }
        case ACTION_TYPE.MOVE: {
            const command = view.getUint8(1, true);
            const entityID = view.getInt16(2, true);
            const targetID = view.getInt16(4, true);
            const pathLength = view.getUint16(6, true);
            const path = [];
            let byteOffset = MOVE_HEADER_SIZE;

            for(let i = 0; i < pathLength; i++) {
                const deltaX = view.getInt16(byteOffset, true);
                const deltaY = view.getInt16(byteOffset + 2, true);
                const tileX = view.getInt16(byteOffset + 4, true);
                const tileY = view.getInt16(byteOffset + 6, true);

                path.push(createStep(deltaX, deltaY, tileX, tileY));
                byteOffset += MOVE_STEP_SIZE;
            }

            return createMoveRequest(entityID, path, command, targetID);
        }
    }

    return null;
}