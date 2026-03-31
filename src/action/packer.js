import { ACTION_TYPE } from "../enums.js";
import { createStep } from "../systems/pathfinding.js";
import { createAttackRequest, createEndTurnIntent, createMoveRequest } from "./actionHelper.js";

/*
    0x00 -> type
*/
export const packEndTurnIntent = function(data) {
    const buffer = new ArrayBuffer(1);
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
export const packAttackIntent = function(data) {
    const { entityID, targetID, command } = data;
    const buffer = new ArrayBuffer(6);
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
export const packMoveIntent = function(data) {
    const { entityID, targetID, command, path } = data;
    const BUFFER_SIZE = 8 + path.length * 4 * 2;
    const buffer = new ArrayBuffer(BUFFER_SIZE);
    const view = new DataView(buffer);

    view.setUint8(0, ACTION_TYPE.MOVE);
    view.setUint8(1, command, true);
    view.setInt16(2, entityID, true);
    view.setInt16(4, targetID, true);
    view.setUint16(6, path.length, true);

    let byteOffset = 8;

    for(let i = 0; i < path.length; i++) {
        const { deltaX, deltaY, tileX, tileY } = path[i];

        view.setInt16(byteOffset, deltaX, true);
        view.setInt16(byteOffset + 2, deltaY, true);
        view.setInt16(byteOffset + 4, tileX, true);
        view.setInt16(byteOffset + 6, tileY, true);

        byteOffset += 8;
    }

    return buffer;
}

export const unpackIntent = function(data) {
    const view = new DataView(data);
    const type = view.getUint8(0);

    switch(type) {
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
            let byteOffset = 8;

            for(let i = 0; i < pathLength; i++) {
                const deltaX = view.getInt16(byteOffset, true);
                const deltaY = view.getInt16(byteOffset + 2, true);
                const tileX = view.getInt16(byteOffset + 4, true);
                const tileY = view.getInt16(byteOffset + 6, true);

                path.push(createStep(deltaX, deltaY, tileX, tileY));
                byteOffset += 8;
            }

            return createMoveRequest(entityID, path, command, targetID);
        }
    }

    return null;
}