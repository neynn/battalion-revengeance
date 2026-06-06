import { assertMemoryLayoutSize, createDataLayout, DATA_TYPE, getViewValue, setViewValue } from "../../engine/network/packing.js";
import { createEntitySnapshot } from "../snapshot/entitySnapshot.js";

export const ENTITY_SNAPSHOT_SIZE = 36;

const ENTITY_SNAPSHOT_LAYOUT = [
    createDataLayout("shop", DATA_TYPE.UINT8),
    createDataLayout("doneMoves", DATA_TYPE.UINT8),
    createDataLayout("doneActions", DATA_TYPE.UINT8),
    createDataLayout("allowedMoves", DATA_TYPE.UINT8),
    createDataLayout("allowedActions", DATA_TYPE.UINT8),
    createDataLayout("bonusMoves", DATA_TYPE.UINT8),
    createDataLayout("bonusActions", DATA_TYPE.UINT8),
    createDataLayout("direction", DATA_TYPE.UINT8),
    createDataLayout("state", DATA_TYPE.UINT8), 
    createDataLayout("morale", DATA_TYPE.UINT8),
    createDataLayout("moraleDelta", DATA_TYPE.INT8),
    createDataLayout("teamID", DATA_TYPE.INT8),
    createDataLayout("turns", DATA_TYPE.UINT16),
    createDataLayout("cash", DATA_TYPE.UINT16),
    createDataLayout("flags", DATA_TYPE.UINT16),
    createDataLayout("health", DATA_TYPE.UINT16),
    createDataLayout("type", DATA_TYPE.INT16),
    createDataLayout("tileX", DATA_TYPE.INT16),
    createDataLayout("tileY", DATA_TYPE.INT16),
    createDataLayout("tileZ", DATA_TYPE.INT16),
    createDataLayout("transport", DATA_TYPE.INT16),
    createDataLayout("id", DATA_TYPE.INT16),
    createDataLayout("name", DATA_TYPE.INT16),
    createDataLayout("desc", DATA_TYPE.INT16)
];

assertMemoryLayoutSize("EntitySnapshot", ENTITY_SNAPSHOT_LAYOUT, ENTITY_SNAPSHOT_SIZE);

/**
 * [S16]
 */
export const ENTITY_ID_SIZE = 2;

/**
 * 0x00 [S16] -> tileX
 * 
 * 0x02 [S16] -> tileY
 */
export const MINE_SIZE = 4;

/**
 * 0x00 [S8] -> deltaX
 * 
 * 0x01 [S8] -> deltaY
 */
export const MOVE_STEP_SIZE = 2;

/**
 * 0x00 [S16] -> entityID
 * 
 * 0x02 [S16] -> delta
 * 
 * 0x04 [U16] -> health
 */
export const ENTITY_RESOLUTION_SIZE = ENTITY_ID_SIZE + 4;

/**
 * 0x00 [U8] -> type
 * 
 * 0x01 [U32] -> version
 * 
 * 0x05 [U16] -> planCount
 */
export const GAME_UPDATE_HEADER_SIZE = 7;

const BIT_8 = 1;
const BIT_16 = 2;


/**
 * 
 * @param {number} planCount 
 * @returns {number}
 */
export const getGameUpdateHeaderSize = function(planCount) {
    return GAME_UPDATE_HEADER_SIZE + (BIT_16 * planCount);
}

/**
 * 
 * @param {*} step 
 * @param {DataView} view 
 * @param {number} byteOffset 
 * @returns {number}
 */
export const packStep = function(step, view, byteOffset) {
    view.setInt8(byteOffset, step.deltaX);
    byteOffset += BIT_8;
    view.setInt8(byteOffset, step.deltaY);
    byteOffset += BIT_8;

    return byteOffset;
}

/**
 * 
 * @param {*} step 
 * @param {DataView} view 
 * @param {number} byteOffset 
 * @returns {number}
 */
export const unpackStep = function(step, view, byteOffset) {
    step.deltaX = view.getInt8(byteOffset);
    byteOffset += BIT_8;
    step.deltaY = view.getInt8(byteOffset);
    byteOffset += BIT_8;

    return byteOffset;
}

/**
 * 
 * @param {*} resolution 
 * @param {DataView} view 
 * @param {number} byteOffset 
 * @returns {number}
 */
export const packEntityResolution = function(resolution, view, byteOffset) {
    view.setInt16(byteOffset, resolution.entityID, true);
    byteOffset += BIT_16;
    view.setInt16(byteOffset, resolution.delta, true);
    byteOffset += BIT_16;
    view.setUint16(byteOffset, resolution.health, true);
    byteOffset += BIT_16;

    return byteOffset;
}

/**
 * 
 * @param {*} resolution 
 * @param {DataView} view 
 * @param {number} byteOffset 
 * @returns {number}
 */
export const unpackEntityResolution = function(resolution, view, byteOffset) {
    resolution.entityID = view.getInt16(byteOffset, true);
    byteOffset += BIT_16;
    resolution.delta = view.getInt16(byteOffset, true);
    byteOffset += BIT_16;
    resolution.health = view.getUint16(byteOffset, true);
    byteOffset += BIT_16;

    return byteOffset;
}

/**
 * 
 * @param {*} snapshot 
 * @param {DataView} view 
 * @param {number} byteOffset 
 * @returns {number}
 */
export const packEntitySnapshot = function(snapshot, view, byteOffset) {
    for(const { name, type, size } of ENTITY_SNAPSHOT_LAYOUT) {
        setViewValue(view, byteOffset, snapshot[name], type);
        byteOffset += size;
    }

    return byteOffset;
}

/**
 * 
 * @param {*} snapshot 
 * @param {DataView} view 
 * @param {number} byteOffset 
 * @returns {number}
 */
export const unpackEntitySnapshot = function(snapshot, view, byteOffset) {
    for(const { name, type, size } of ENTITY_SNAPSHOT_LAYOUT) {
        snapshot[name] = getViewValue(view, byteOffset, type);
        byteOffset += size;
    }

    return byteOffset;
}