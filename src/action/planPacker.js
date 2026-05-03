import { ExecutionPlan } from "../../engine/action/executionPlan.js";
import { ACTION_TYPE } from "../enums.js";
import { createEntityResolution } from "./interactionResolver.js";
import { ENTITY_ID_SIZE, ENTITY_RESOLUTION_SIZE, ENTITY_SNAPSHOT_SIZE, MINE_SIZE, MOVE_STEP_SIZE, packEntityResolution, packEntitySnapshot, packStep, unpackEntityResolution, unpackEntitySnapshot, unpackStep } from "./packer_constants.js";
import { AttackActionVTable } from "./types/attack.js";
import { CaptureActionVTable } from "./types/capture.js";
import { CloakActionVTable } from "./types/cloak.js";
import { DeathActionVTable } from "./types/death.js";
import { EndTurnVTable } from "./types/endTurn.js";
import { EntitySpawnVTable } from "./types/entitySpawn.js";
import { ExplodeTileVTable } from "./types/explodeTile.js";
import { ExtractVTable } from "./types/extract.js";
import { HealVTable } from "./types/heal.js";
import { MineTriggerVTable } from "./types/mineTrigger.js";
import { MoveVTable } from "./types/move.js";
import { ProduceVTable } from "./types/produceEntity.js";
import { PurchaseVTable } from "./types/purchaseEntity.js";
import { InterruptVTable } from "./types/interrupt.js";
import { StartTurnVTable } from "./types/startTurn.js";
import { UncloakVTable } from "./types/uncloak.js";
import { ToTransportVTable } from "./types/toTransport.js";
import { FromTransportVTable } from "./types/fromTransport.js";

/**
 * 0x00 [U8] -> type
 * 
 * 0x01 [S16] -> entityID
 * 
 * 0x03 [S16] -> entityTypeID
 * 
 * 0x05 [U16] -> health
 */
const FROM_TRANSPORT_HEADER_SIZE = 7;

/**
 * 
 * @param {*} data 
 * @param {DataView} view 
 * @param {number} beginPtr 
 */
const packFromTransportPlan = function(data, view, beginPtr) {
    const { entityID, entityTypeID, health } = data;

    view.setUint8(beginPtr + 0, ACTION_TYPE.FROM_TRANSPORT);
    view.setInt16(beginPtr + 1, entityID, true);
    view.setInt16(beginPtr + 3, entityTypeID, true);
    view.setUint16(beginPtr + 5, health, true);
}

/**
 * 0x00 [U8] -> type
 * 
 * 0x01 [S16] -> entityID
 * 
 * 0x03 [S16] -> entityTypeID
 * 
 * 0x05 [U16] -> cost
 * 
 * 0x07 [U16] -> health
 */
const TO_TRANSPORT_HEADER_SIZE = 9;

/**
 * 
 * @param {*} data 
 * @param {DataView} view 
 * @param {number} beginPtr 
 */
const packToTransportPlan = function(data, view, beginPtr) {
    const { entityID, entityTypeID, health, cost } = data;

    view.setUint8(beginPtr + 0, ACTION_TYPE.TO_TRANSPORT);
    view.setInt16(beginPtr + 1, entityID, true);
    view.setInt16(beginPtr + 3, entityTypeID, true);
    view.setUint16(beginPtr + 5, cost, true);
    view.setUint16(beginPtr + 7, health, true);
}

/*
    0x00 -> type,
    0x01 -> interruptType,
    0x02 -> eventID
*/
const INTERRUPT_HEADER_SIZE = 4;

const packInterruptPlan = function(data, view, beginPtr) {
    const { event, type } = data;

    view.setUint8(beginPtr + 0, ACTION_TYPE.INTERRUPT);
    view.setUint8(beginPtr + 1, type);
    view.setInt16(beginPtr + 2, event, true);
}

/*
    0x00 -> type,
    0x01 -> entity_count
    0x02 -> mine_count,
    0x03 -> entityID
*/
const UNCLOAK_HEADER_SIZE = 5;

const packUncloakPlan = function(data, view, beginPtr) {
    const { entityID, entities, mines } = data;

    view.setUint8(beginPtr + 0, ACTION_TYPE.UNCLOAK);
    view.setUint8(beginPtr + 1, entities.length);
    view.setUint8(beginPtr + 2, mines.length);
    view.setInt16(beginPtr + 3, entityID, true);

    let byteOffset = beginPtr + UNCLOAK_HEADER_SIZE;

    for(let i = 0; i < entities.length; i++) {
        view.setInt16(byteOffset, entities[i], true);

        byteOffset += 2;
    }

    for(let i = 0; i < mines.length; i++) {
        const { x, y } = mines[i];

        view.setInt16(byteOffset, x, true);
        view.setInt16(byteOffset + 2, y, true);

        byteOffset += 4;
    }
}

/*
    0x00 -> type,
    0x01 -> teamID,
    0x02 -> count
*/
const START_TURN_HEADER_SIZE = 4;

const packStartTurnPlan = function(data, view, beginPtr) {
    const { teamID, resolutions } = data;
    
    view.setUint8(beginPtr + 0, ACTION_TYPE.START_TURN);
    view.setInt8(beginPtr + 1, teamID);
    view.setUint16(beginPtr + 2, resolutions.length, true);

    let byteOffset = beginPtr + START_TURN_HEADER_SIZE;

    for(let i = 0; i < resolutions.length; i++) {
        byteOffset = packEntityResolution(resolutions[i], view, byteOffset);
    }
}

/*
    0x00 -> type,
    0x01 -> nextID,
    0x03 -> cost,
    0x05 -> snapshot
*/
const PURCHASE_HEADER_SIZE = 5 + ENTITY_SNAPSHOT_SIZE;

const packPurchasePlan = function(data, view, beginPtr) {
    const { nextID, cost, snapshot } = data;

    view.setUint8(beginPtr + 0, ACTION_TYPE.PURCHASE_ENTITY);
    view.setInt16(beginPtr + 1, nextID, true);
    view.setUint16(beginPtr + 3, cost, true);

    packEntitySnapshot(snapshot, view, beginPtr + 5);
}

/*
    0x00 -> type,
    0x01 -> entityID,
    0x03 -> nextID,
    0x05 -> cost,
    0x07 -> snapshot
*/
const PRODUCE_HEADER_SIZE = 7 + ENTITY_SNAPSHOT_SIZE;

const packProducePlan = function(data, view, beginPtr) {
    const { entityID, nextID, cost, snapshot } = data;

    view.setUint8(beginPtr + 0, ACTION_TYPE.PRODUCE_ENTITY);
    view.setInt16(beginPtr + 1, entityID, true);
    view.setInt16(beginPtr + 3, nextID, true);
    view.setUint16(beginPtr + 5, cost, true);

    packEntitySnapshot(snapshot, view, beginPtr + 7);
}

/*
    0x00 -> type,
    0x01 -> flags,
    0x02 -> entityID,
    0x04 -> count
*/
/**
 * 0x00 [U8] -> type
 * 
 * 0x01 [U8] -> flags
 * 
 * 0x02 [S16] -> entityID
 * 
 * 0x04 [S16] -> originX
 * 
 * 0x06 [S16] -> originY
 * 
 * 0x08 [U16] -> count
 */
const MOVE_HEADER_SIZE = 10;

const packMovePlan = function(data, view, beginPtr) {
    const { entityID, originX, originY, flags, path } = data;

    view.setUint8(beginPtr + 0, ACTION_TYPE.MOVE);
    view.setUint8(beginPtr + 1, flags);
    view.setInt16(beginPtr + 2, entityID, true);
    view.setInt16(beginPtr + 4, originX, true);
    view.setInt16(beginPtr + 6, originY, true);
    view.setUint16(beginPtr + 8, path.length, true);

    let byteOffset = beginPtr + MOVE_HEADER_SIZE;

    for(let i = 0; i < path.length; i++) {
        byteOffset = packStep(path[i], view, byteOffset);
    }
}

/*
    0x00 -> type,
    0x01 -> entityID,
    0x03 -> health,
    0x05 -> tileX,
    0x07 -> tileY
*/
const MINE_TRIGGER_HEADER_SIZE = 9;

const packMineTriggerPlan = function(data, view, beginPtr) {
    const { entityID, health, tileX, tileY } = data;

    view.setUint8(beginPtr + 0, ACTION_TYPE.MINE_TRIGGER);
    view.setInt16(beginPtr + 1, entityID, true);
    view.setUint16(beginPtr + 3, health, true);
    view.setInt16(beginPtr + 5, tileX, true);
    view.setInt16(beginPtr + 7, tileY, true);
}

/**
 * 0x00 [U8] -> type
 * 
 * 0x01 [S16] -> entityID
 * 
 * 0x03 [S16] -> targetID
 * 
 * 0x05 [U16] -> count
 */
const HEAL_HEADER_SIZE = 7;

const packHealPlan = function(data, view, beginPtr) {
    const { entityID, targetID, resolutions } = data;

    view.setUint8(beginPtr + 0, ACTION_TYPE.HEAL);
    view.setInt16(beginPtr + 1, entityID, true);
    view.setInt16(beginPtr + 3, targetID, true);
    view.setUint16(beginPtr + 5, resolutions.length, true);

    let byteOffset = beginPtr + HEAL_HEADER_SIZE;

    for(let i = 0; i < resolutions.length; i++) {
        byteOffset = packEntityResolution(resolutions[i], view, byteOffset);
    }
}

/*
    0x00 -> type,
    0x01 -> entityID
    0x03 -> value
*/
const EXTRACT_ORE_HEADER_SIZE = 5;

const packExtractOrePlan = function(data, view, beginPtr) {
    const { entityID, value } = data;

    view.setUint8(beginPtr + 0, ACTION_TYPE.EXTRACT);
    view.setInt16(beginPtr + 1, entityID, true);
    view.setUint16(beginPtr + 3, value, true);
}

/*
    0x00 -> type,
    0x01 -> layer
    0x02 -> tileX,
    0x04 -> tileY,
    0x06 -> entityID
*/
const EXPLODE_TILE_HEADER_SIZE = 8;

const packExplodeTilePlan = function(data, view, beginPtr) {
    const { entityID, layer, tileX, tileY } = data;

    view.setUint8(beginPtr + 0, ACTION_TYPE.EXPLODE_TILE);
    view.setUint8(beginPtr + 1, layer);
    view.setInt16(beginPtr + 2, tileX, true);
    view.setInt16(beginPtr + 4, tileY, true);
    view.setInt16(beginPtr + 6, entityID, true);
}

/*
    0x00 -> type,
    0x01 -> entityID,
    0x03 -> snapshot
*/
const ENTITY_SPAWN_HEADER_SIZE = 3 + ENTITY_SNAPSHOT_SIZE;

const packEntitySpawnPlan = function(data, view, beginPtr) {
    const { entityID, snapshot } = data;

    view.setUint8(beginPtr + 0, ACTION_TYPE.ENTITY_SPAWN);
    view.setInt16(beginPtr + 1, entityID, true);

    packEntitySnapshot(snapshot, view, beginPtr + 3);
}

/*
    0x00 -> type
*/
const END_TURN_HEADER_SIZE = 1;

const packEndTurnPlan = function(data, view, beginPtr) {
    view.setUint8(beginPtr + 0, ACTION_TYPE.END_TURN);
}

/*
    0x00 -> type,
    0x01 -> count
*/
const DEATH_HEADER_SIZE = 3;

const packDeathPlan = function(data, view, beginPtr) {
    const { entities } = data;

    view.setUint8(beginPtr + 0, ACTION_TYPE.DEATH);
    view.setUint16(beginPtr + 1, entities.length, true);

    let byteOffset = beginPtr + DEATH_HEADER_SIZE;

    for(let i = 0; i < entities.length; i++) {
        view.setInt16(byteOffset, entities[i], true);

        byteOffset += ENTITY_ID_SIZE;
    }
}

/**
 * 0x00 [U8] -> type
 * 
 * 0x01 [S16] -> entityID
 */
const CLOAK_HEADER_SIZE = 3;

const packCloakPlan = function(data, view, beginPtr) {
    const { entityID } = data;

    view.setUint8(beginPtr + 0, ACTION_TYPE.CLOAK);
    view.setInt16(beginPtr + 1, entityID, true);
}

/**
 *  0x00 [U8] -> type
 * 
 *  0x01 [S16] -> entityID
 * 
 *  0x03 [S16] -> targetX
 * 
 *  0x05 [S16] -> targetY
 */
const CAPTURE_HEADER_SIZE = 7;

const CaptureTable = {
    getSize: function(data) {
        return CAPTURE_HEADER_SIZE;
    },
    write: function(data, view, beginPtr) {
        const { entityID, targetX, targetY } = data;

        view.setUint8(beginPtr + 0, ACTION_TYPE.CAPTURE);
        view.setInt16(beginPtr + 1, entityID, true);
        view.setInt16(beginPtr + 3, targetX, true);
        view.setInt16(beginPtr + 5, targetY, true);
    },
    read: function(view, beginPtr) {
        const data = CaptureActionVTable.createData();

        data.entityID = view.getInt16(beginPtr + 1, true);
        data.targetX = view.getInt16(beginPtr + 3, true);
        data.targetY = view.getInt16(beginPtr + 5, true);

        return data;
    }
};

/**
 *  0x00 [U8] -> type
 * 
 *  0x01 [U8] -> flags
 * 
 *  0x02 [S16] -> attackerID
 * 
 *  0x04 [S16] -> targetID
 * 
 *  0x06 [S32] -> resourceDamage
 * 
 *  0x10 [U16] -> EntityResolution count
 */
const ATTACK_HEADER_SIZE = 12;

const AttackTable = {
    getSize: function(data) {
        return ATTACK_HEADER_SIZE + ENTITY_RESOLUTION_SIZE * data.resolutions.length;
    },
    write: function(data, view, beginPtr) {
        const { attackerID, targetID, resourceDamage, flags, resolutions } = data;

        view.setUint8(beginPtr + 0, ACTION_TYPE.ATTACK);
        view.setUint8(beginPtr + 1, flags);
        view.setInt16(beginPtr + 2, attackerID, true);
        view.setInt16(beginPtr + 4, targetID, true);
        view.setInt32(beginPtr + 6, resourceDamage, true);
        view.setUint16(beginPtr + 10, resolutions.length, true);

        let byteOffset = beginPtr + ATTACK_HEADER_SIZE;

        for(let i = 0; i < resolutions.length; i++) {
            byteOffset = packEntityResolution(resolutions[i], view, byteOffset);
        }
    },
    read: function(view, beginPtr) {
        const data = AttackActionVTable.createData();

        data.flags = view.getUint8(beginPtr + 1);
        data.attackerID = view.getInt16(beginPtr + 2, true);
        data.targetID = view.getInt16(beginPtr + 4, true);
        data.resourceDamage = view.getInt32(beginPtr + 6, true);
        
        const count = view.getUint16(beginPtr + 10, true);

        let byteOffset = beginPtr + ATTACK_HEADER_SIZE;

        for(let i = 0; i < count; i++) {
            const resolution = createEntityResolution();

            byteOffset = unpackEntityResolution(resolution, view, byteOffset);
            data.resolutions.push(resolution);
        }

        return data;
    }
};

const Table = {
    getSize: function(data) {

    },
    write: function(data, view, beginPtr) {

    },
    read: function(view, beginPtr) {
        
    }
}

/**
 * 
 * @param {ExecutionPlan} executionPlan 
 * @returns {number} Size of plan data in bytes.
 */
export const getPlanSize = function(executionPlan) {
    const { id, type, data } = executionPlan;

    switch(type) {
        case ACTION_TYPE.ATTACK: return AttackTable.getSize(data);
        case ACTION_TYPE.CAPTURE: return CaptureTable.getSize(data);
        case ACTION_TYPE.CLOAK: return CLOAK_HEADER_SIZE;
        case ACTION_TYPE.DEATH: return DEATH_HEADER_SIZE + ENTITY_ID_SIZE + data.entities.length;
        case ACTION_TYPE.END_TURN: return END_TURN_HEADER_SIZE;
        case ACTION_TYPE.ENTITY_SPAWN: return ENTITY_SPAWN_HEADER_SIZE;
        case ACTION_TYPE.EXPLODE_TILE: return EXPLODE_TILE_HEADER_SIZE;
        case ACTION_TYPE.EXTRACT: return EXTRACT_ORE_HEADER_SIZE;
        case ACTION_TYPE.HEAL: return HEAL_HEADER_SIZE + ENTITY_RESOLUTION_SIZE * data.resolutions.length;
        case ACTION_TYPE.MINE_TRIGGER: return MINE_TRIGGER_HEADER_SIZE;
        case ACTION_TYPE.MOVE: return MOVE_HEADER_SIZE + MOVE_STEP_SIZE * data.path.length;
        case ACTION_TYPE.PRODUCE_ENTITY: return PRODUCE_HEADER_SIZE;
        case ACTION_TYPE.PURCHASE_ENTITY: return PURCHASE_HEADER_SIZE;
        case ACTION_TYPE.START_TURN: return START_TURN_HEADER_SIZE + ENTITY_RESOLUTION_SIZE * data.resolutions.length;
        case ACTION_TYPE.UNCLOAK: return UNCLOAK_HEADER_SIZE + ENTITY_ID_SIZE * data.entities.length + MINE_SIZE * data.mines.length;
        case ACTION_TYPE.INTERRUPT: return INTERRUPT_HEADER_SIZE;
        case ACTION_TYPE.TO_TRANSPORT: return TO_TRANSPORT_HEADER_SIZE;
        case ACTION_TYPE.FROM_TRANSPORT: return FROM_TRANSPORT_HEADER_SIZE;
        default: return 0;
    }
}

/**
 * 
 * @param {ExecutionPlan} executionPlan 
 * @param {DataView} view 
 * @param {number} beginPtr 
 * @returns
 */
export const writePlan = function(executionPlan, view, beginPtr) {
    const { id, type, data } = executionPlan;

    switch(type) {
        case ACTION_TYPE.ATTACK: return AttackTable.write(data, view, beginPtr);
        case ACTION_TYPE.CAPTURE: return CaptureTable.write(data, view, beginPtr);
        case ACTION_TYPE.CLOAK: return packCloakPlan(data, view, beginPtr);
        case ACTION_TYPE.DEATH: return packDeathPlan(data, view, beginPtr);
        case ACTION_TYPE.END_TURN: return packEndTurnPlan(data, view, beginPtr);
        case ACTION_TYPE.ENTITY_SPAWN: return packEntitySpawnPlan(data, view, beginPtr);
        case ACTION_TYPE.EXPLODE_TILE: return packExplodeTilePlan(data, view, beginPtr);
        case ACTION_TYPE.EXTRACT: return packExtractOrePlan(data, view, beginPtr);
        case ACTION_TYPE.HEAL: return packHealPlan(data, view, beginPtr);
        case ACTION_TYPE.MINE_TRIGGER: return packMineTriggerPlan(data, view, beginPtr);
        case ACTION_TYPE.MOVE: return packMovePlan(data, view, beginPtr);
        case ACTION_TYPE.PRODUCE_ENTITY: return packProducePlan(data, view, beginPtr);
        case ACTION_TYPE.PURCHASE_ENTITY: return packPurchasePlan(data, view, beginPtr);
        case ACTION_TYPE.START_TURN: return packStartTurnPlan(data, view, beginPtr);
        case ACTION_TYPE.UNCLOAK: return packUncloakPlan(data, view, beginPtr);
        case ACTION_TYPE.INTERRUPT: return packInterruptPlan(data, view, beginPtr);
        case ACTION_TYPE.TO_TRANSPORT: return packToTransportPlan(data, view, beginPtr);
        case ACTION_TYPE.FROM_TRANSPORT: return packFromTransportPlan(data, view, beginPtr);
    }
}

/**
 * 
 * @param {DataView} view 
 * @param {number} beginPtr 
 * @returns {ExecutionPlan}
 */
export const unpackPlan = function(view, beginPtr) {
    const type = view.getUint8(beginPtr + 0);
    const plan = new ExecutionPlan(-1, type);
    let data = null;

    switch(type) {
        case ACTION_TYPE.FROM_TRANSPORT: {
            data = FromTransportVTable.createData();
            data.entityID = view.getInt16(beginPtr + 1, true);
            data.entityTypeID = view.getInt16(beginPtr + 3, true);
            data.health = view.getUint16(beginPtr + 5, true);
            break;
        }
        case ACTION_TYPE.TO_TRANSPORT: {
            data = ToTransportVTable.createData();
            data.entityID = view.getInt16(beginPtr + 1, true);
            data.entityTypeID = view.getInt16(beginPtr + 3, true);
            data.cost = view.getUint16(beginPtr + 5, true);
            data.health = view.getUint16(beginPtr + 7, true);
            break;
        }
        case ACTION_TYPE.INTERRUPT: {
            data = InterruptVTable.createData();
            data.type = view.getUint8(beginPtr + 1);
            data.event = view.getInt16(beginPtr + 2, true);
            break;
        }
        case ACTION_TYPE.UNCLOAK: {
            data = UncloakVTable.createData();

            const entityCount = view.getUint8(beginPtr + 1);
            const mineCount = view.getUint8(beginPtr + 2);
            
            data.entityID = view.getInt16(beginPtr + 3, true);

            let byteOffset = beginPtr + UNCLOAK_HEADER_SIZE;

            for(let i = 0; i < entityCount; i++) {
                data.entities.push(view.getInt16(byteOffset, true));
                
                byteOffset += 2;
            }

            for(let i = 0; i < mineCount; i++) {
                const tileX = view.getInt16(byteOffset, true);
                const tileY = view.getInt16(byteOffset + 2, true);

                data.mines.push({
                    "x": tileX,
                    "y": tileY
                });

                byteOffset += 4;
            }

            break;
        }
        case ACTION_TYPE.START_TURN: {
            data = StartTurnVTable.createData();
            data.teamID = view.getInt8(beginPtr + 1);
            
            const count = view.getUint16(beginPtr + 2, true);
            let byteOffset = beginPtr + START_TURN_HEADER_SIZE;

            for(let i = 0; i < count; i++) {
                const resolution = createEntityResolution();

                byteOffset = unpackEntityResolution(resolution, view, byteOffset);
                data.resolutions.push(resolution);
            }

            break;
        }
        case ACTION_TYPE.PURCHASE_ENTITY: {
            data = PurchaseVTable.createData();
            data.nextID = view.getInt16(beginPtr + 1, true);
            data.cost = view.getUint16(beginPtr + 3, true);

            unpackEntitySnapshot(data.snapshot, view, beginPtr + 5);
            break;
        }
        case ACTION_TYPE.PRODUCE_ENTITY: {
            data = ProduceVTable.createData();
            data.entityID = view.getInt16(beginPtr + 1, true);
            data.nextID = view.getInt16(beginPtr + 3, true);
            data.cost = view.getUint16(beginPtr + 5, true);

            unpackEntitySnapshot(data.snapshot, view, beginPtr + 7);
            break;
        }
        case ACTION_TYPE.MOVE: {
            const flags = view.getUint8(beginPtr + 1);
            const entityID = view.getInt16(beginPtr + 2, true);
            const originX = view.getInt16(beginPtr + 4, true);
            const originY = view.getInt16(beginPtr + 6, true);
            const count = view.getUint16(beginPtr + 8, true);

            data = MoveVTable.createData(count);
            data.flags = flags;
            data.entityID = entityID;
            data.originX = originX;
            data.originY = originY;
            
            let byteOffset = beginPtr + MOVE_HEADER_SIZE;

            for(let i = 0; i < count; i++) {
                byteOffset = unpackStep(data.path[i], view, byteOffset);
            }

            break;
        }
        case ACTION_TYPE.MINE_TRIGGER: {
            data = MineTriggerVTable.createData();
            data.entityID = view.getInt16(beginPtr + 1, true);
            data.health = view.getUint16(beginPtr + 3, true);
            data.tileX = view.getInt16(beginPtr + 5, true);
            data.tileY = view.getInt16(beginPtr + 7, true);
            break;
        }
        case ACTION_TYPE.HEAL: {
            data = HealVTable.createData();
            data.entityID = view.getInt16(beginPtr + 1, true);
            data.targetID = view.getInt16(beginPtr + 3, true);

            const count = view.getUint16(beginPtr + 5, true);
            let byteOffset = beginPtr + HEAL_HEADER_SIZE;

            for(let i = 0; i < count; i++) {
                const resolution = createEntityResolution();

                byteOffset = unpackEntityResolution(resolution, view, byteOffset);
                data.resolutions.push(resolution);
            }

            break;
        }
        case ACTION_TYPE.EXTRACT: {
            data = ExtractVTable.createData();
            data.entityID = view.getInt16(beginPtr + 1, true);
            data.value = view.getUint16(beginPtr + 3, true);
            break;
        }
        case ACTION_TYPE.EXPLODE_TILE: {
            data = ExplodeTileVTable.createData();
            data.layer = view.getUint8(beginPtr + 1);
            data.tileX = view.getInt16(beginPtr + 2, true);
            data.tileY = view.getInt16(beginPtr + 4, true);
            data.entityID = view.getInt16(beginPtr + 6, true);
            break;
        }
        case ACTION_TYPE.ENTITY_SPAWN: {
            data = EntitySpawnVTable.createData();
            data.entityID = view.getInt16(beginPtr + 1, true);

            unpackEntitySnapshot(data.snapshot, view, beginPtr + 3);
            break;
        }
        case ACTION_TYPE.END_TURN: {
            data = EndTurnVTable.createData();
            break;
        }
        case ACTION_TYPE.DEATH: {
            data = DeathActionVTable.createData();

            const count = view.getUint16(beginPtr + 1, true);
            let byteOffset = beginPtr + DEATH_HEADER_SIZE;

            for(let i = 0; i < count; i++) {
                data.entities.push(view.getInt16(byteOffset, true));

                byteOffset += ENTITY_ID_SIZE;
            }

            break;
        }
        case ACTION_TYPE.CLOAK: {
            data = CloakActionVTable.createData();
            data.entityID = view.getInt16(beginPtr + 1, true);
            break;
        }
        case ACTION_TYPE.CAPTURE: {
            data = CaptureTable.read(view, beginPtr);
            break;
        }
        case ACTION_TYPE.ATTACK: {
            data = AttackTable.read(view, beginPtr);
            break;
        }
    }

    plan.setData(data);

    return plan;
}