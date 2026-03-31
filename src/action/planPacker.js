import { ACTION_TYPE } from "../enums.js";
import { createStep } from "../systems/pathfinding.js";
import { ENTITY_RESOLUTION_SIZE, ENTITY_SNAPSHOT_SIZE, MOVE_STEP_SIZE, packEntitySnapshot, unpackEntitySnapshot } from "./packer_constants.js";
import { AttackAction } from "./types/attack.js";
import { CaptureAction } from "./types/capture.js";
import { CloakAction } from "./types/cloak.js";
import { DeathAction } from "./types/death.js";
import { EndTurnAction } from "./types/endTurn.js";
import { ExplodeTileAction } from "./types/explodeTile.js";
import { ExtractAction } from "./types/extract.js";
import { HealAction } from "./types/heal.js";
import { MineTriggerAction } from "./types/mineTrigger.js";
import { MoveAction } from "./types/move.js";
import { ProduceEntityAction } from "./types/produceEntity.js";
import { PurchaseEntityAction } from "./types/purchaseEntity.js";

/*
    0x00 -> type,
    0x01 -> nextID,
    0x03 -> cost,
    0x05 -> snapshot
*/
const PURCHASE_HEADER_SIZE = 5 + ENTITY_SNAPSHOT_SIZE;

export const packPurchasePlan = function(data) {
    const { nextID, cost, snapshot } = data;
    const buffer = new ArrayBuffer(PURCHASE_HEADER_SIZE);
    const view = new DataView(buffer);

    view.setUint8(0, ACTION_TYPE.PURCHASE_ENTITY);
    view.setInt16(1, nextID, true);
    view.setUint16(3, cost, true);
    packEntitySnapshot(snapshot, view, 5);

    return buffer;
}

/*
    0x00 -> type,
    0x01 -> entityID,
    0x03 -> nextID,
    0x05 -> cost,
    0x07 -> snapshot
*/
const PRODUCE_HEADER_SIZE = 7 + ENTITY_SNAPSHOT_SIZE;

export const packProducePlan = function(data) {
    const { entityID, nextID, cost, snapshot } = data;
    const buffer = new ArrayBuffer(PRODUCE_HEADER_SIZE);
    const view = new DataView(buffer);

    view.setUint8(0, ACTION_TYPE.PRODUCE_ENTITY);
    view.setInt16(1, entityID, true);
    view.setInt16(3, nextID, true);
    view.setUint16(5, cost, true);
    packEntitySnapshot(snapshot, view, 7);

    return buffer;
}

/*
    0x00 -> type,
    0x01 -> flags,
    0x02 -> entityID,
    0x04 -> count
*/
const MOVE_HEADER_SIZE = 6;

export const packMovePlan = function(data) {
    const { entityID, flags, path } = data;
    const BUFFER_SIZE = MOVE_HEADER_SIZE + MOVE_STEP_SIZE * path.length;
    const buffer = new ArrayBuffer(BUFFER_SIZE);
    const view = new DataView(buffer);

    view.setUint8(0, ACTION_TYPE.MOVE);
    view.setUint8(1, flags);
    view.setInt16(2, entityID, true);
    view.setUint16(4, path.length, true);

    let byteOffset = MOVE_HEADER_SIZE;

    for(let i = 0; i < path.length; i++) {
        const { deltaX, deltaY, tileX, tileY } = path[i];

        view.setInt8(byteOffset, deltaX);
        view.setInt8(byteOffset + 1, deltaY);
        view.setInt16(byteOffset + 2, tileX, true);
        view.setInt16(byteOffset + 4, tileY, true);

        byteOffset += MOVE_STEP_SIZE;
    }

    return buffer;
}

/*
    0x00 -> type,
    0x01 -> entityID,
    0x03 -> health,
    0x05 -> tileX,
    0x07 -> tileY
*/
const MINE_TRIGGER_HEADER_SIZE = 9;

export const packMineTriggerPlan = function(data) {
    const { entityID, health, tileX, tileY } = data;
    const buffer = new ArrayBuffer(MINE_TRIGGER_HEADER_SIZE);
    const view = new DataView(buffer);

    view.setUint8(0, ACTION_TYPE.MINE_TRIGGER);
    view.setInt16(1, entityID, true);
    view.setUint16(3, health, true);
    view.setInt16(5, tileX, true);
    view.setInt16(7, tileY, true);

    return buffer;
}

/*
    0x00 -> type,
    0x01 -> entityID,
    0x03 -> targetID
    0x05 -> count
*/
const HEAL_HEADER_SIZE = 7;

export const packHealPlan = function(data) {
    const { entityID, targetID, resolutions } = data;
    const BUFFER_SIZE = HEAL_HEADER_SIZE + ENTITY_RESOLUTION_SIZE * resolutions.length;
    const buffer = new ArrayBuffer(BUFFER_SIZE);
    const view = new DataView(buffer);

    view.setUint8(0, ACTION_TYPE.HEAL);
    view.setInt16(1, entityID, true);
    view.setInt16(3, targetID, true);
    view.setUint16(5, resolutions.length, true);

    let byteOffset = HEAL_HEADER_SIZE;

    for(let i = 0; i < resolutions.length; i++) {
        const { entityID, delta, health } = resolutions[i];

        view.setInt16(byteOffset, entityID, true);
        view.setInt16(byteOffset + 2, delta, true);
        view.setUint16(byteOffset + 4, health, true);

        byteOffset += ENTITY_RESOLUTION_SIZE;
    }

    return buffer;
}

/*
    0x00 -> type,
    0x01 -> entityID
    0x03 -> value
*/
const EXTRACT_ORE_HEADER_SIZE = 5;

export const packExtractOrePlan = function(data) {
    const { entityID, value } = data;
    const buffer = new ArrayBuffer(EXTRACT_ORE_HEADER_SIZE);
    const view = new DataView(buffer);

    view.setUint8(0, ACTION_TYPE.EXTRACT);
    view.setInt16(1, entityID, true);
    view.setUint16(3, value, true);

    return buffer;
}

/*
    0x00 -> type,
    0x01 -> layer
    0x02 -> tileX,
    0x04 -> tileY,
    0x06 -> entityID
*/
const EXPLODE_TILE_HEADER_SIZE = 8;

export const packExplodeTilePlan = function(data) {
    const { entityID, layer, tileX, tileY } = data;
    const buffer = new ArrayBuffer(EXPLODE_TILE_HEADER_SIZE);
    const view = new DataView(buffer);

    view.setUint8(0, ACTION_TYPE.EXPLODE_TILE);
    view.setUint8(1, layer);
    view.setInt16(2, tileX, true);
    view.setInt16(4, tileY, true);
    view.setInt16(6, entityID, true);

    return buffer;
}

/*
    0x00 -> type,
    0x01 -> count
*/
const ENTITY_SPAWN_HEADER_SIZE = 3;

//Each spawn has a snapshot and an id!
export const packEntitySpawnPlan = function(data) {
    const { spawns } = data;
    const BUFFER_SIZE = ENTITY_SPAWN_HEADER_SIZE + (ENTITY_SNAPSHOT_SIZE + 2) * spawns.length;
    const buffer = new ArrayBuffer(BUFFER_SIZE);
    const view = new DataView(buffer);

    view.setUint8(0, ACTION_TYPE.ENTITY_SPAWN);
    view.setUint16(1, spawns.length, true);

    let byteOffset = END_TURN_HEADER_SIZE;

    for(let i = 0; i < spawns.length; i++) {
        const { id, snapshot } = spawns[i];
        view.setInt16(byteOffset, id, true);

        byteOffset = packEntitySnapshot(snapshot, view, byteOffset + 2);
    }

    return buffer;
}

/*
    0x00 -> type
*/
const END_TURN_HEADER_SIZE = 1;

export const packEndTurnPlan = function(data) {
    const buffer = new ArrayBuffer(END_TURN_HEADER_SIZE);
    const view = new DataView(buffer);

    view.setUint8(ACTION_TYPE.END_TURN);

    return buffer;
}

/*
    0x00 -> type,
    0x01 -> count
*/
const DEATH_HEADER_SIZE = 3;
const DEATH_BLOCK_SIZE = 2;

export const packDeathPlan = function(data) {
    const { entities } = data;
    const BUFFER_SIZE = DEATH_HEADER_SIZE + DEATH_BLOCK_SIZE * entities.length;
    const buffer = new ArrayBuffer(BUFFER_SIZE);
    const view = new DataView(buffer);

    view.setUint8(0, ACTION_TYPE.DEATH);
    view.setUint16(1, entities.length, true);

    let byteOffset = DEATH_HEADER_SIZE;

    for(let i = 0; i < entities.length; i++) {
        view.setInt16(byteOffset, entities[i], true);

        byteOffset += DEATH_BLOCK_SIZE;
    }

    return buffer;
}

/*
    0x00 -> type,
    0x01 -> entityID
*/
const CLOAK_HEADER_SIZE = 3;

export const packCloakPlan = function(data) {
    const { entityID } = data;
    const buffer = new ArrayBuffer(CLOAK_HEADER_SIZE);
    const view = new DataView(buffer);

    view.setUint8(0, ACTION_TYPE.CLOAK);
    view.setInt16(1, entityID, true);

    return buffer;
}

/*
    0x00 -> type,
    0x01 -> entityID,
    0x03 -> targetX,
    0x05 -> targetY
*/
const CAPTURE_HEADER_SIZE = 7;

export const packCapturePlan = function(data) {
    const { entityID, targetX, targetY } = data;
    const buffer = new ArrayBuffer(CAPTURE_HEADER_SIZE);
    const view = new DataView(buffer);

    view.setUint8(0, ACTION_TYPE.CAPTURE);
    view.setInt16(1, entityID, true);
    view.setInt16(3, targetX, true);
    view.setInt16(5, targetY, true);

    return buffer;
}

/*
    0x00 -> type,
    0x01 -> flags,
    0x02 -> attackerID,
    0x04 -> targetID,
    0x06 -> resourceDamage,
    0x10 -> resolutuions length
*/
const ATTACK_HEADER_SIZE = 12;

export const packAttackPlan = function(data) {
    const { attackerID, targetID, resourceDamage, flags, resolutions } = data;
    const BUFFER_SIZE = ATTACK_HEADER_SIZE + ENTITY_RESOLUTION_SIZE * resolutions.length;
    const buffer = new ArrayBuffer(BUFFER_SIZE);
    const view = new DataView(buffer);

    view.setUint8(0, ACTION_TYPE.ATTACK);
    view.setUint8(1, flags);
    view.setInt16(2, attackerID, true);
    view.setInt16(4, targetID, true);
    view.setInt32(6, resourceDamage, true);
    view.setUint16(10, resolutions.length, true);

    let byteOffset = ATTACK_HEADER_SIZE;

    for(let i = 0; i < resolutions.length; i++) {
        const { entityID, health, delta } = resolutions[i];

        view.setInt16(byteOffset, entityID, true);
        view.setInt16(byteOffset + 2, delta, true);
        view.setUint16(byteOffset + 4, health, true);

        byteOffset += ENTITY_RESOLUTION_SIZE;
    }

    return buffer;
}

export const unpackPlan = function(data) {
    const view = new DataView(data);
    const type = view.getUint8(0);

    switch(type) {
        case ACTION_TYPE.PURCHASE_ENTITY: {
            const plan = PurchaseEntityAction.createData();

            plan.nextID = view.getInt16(1, true);
            plan.cost = view.getUint16(3, true);

            unpackEntitySnapshot(plan.snapshot, view, 5);

            return plan;
        }
        case ACTION_TYPE.PRODUCE_ENTITY: {
            const plan = ProduceEntityAction.createData();

            plan.entityID = view.getInt16(1, true);
            plan.nextID = view.getInt16(3, true);
            plan.cost = view.getUint16(5, true);

            unpackEntitySnapshot(plan.snapshot, view, 7);

            return plan;
        }
        case ACTION_TYPE.MOVE: {
            const plan = MoveAction.createData();

            plan.flags = view.getUint8(1);
            plan.entityID = view.getInt16(2, true);

            const count = view.getUint16(4, true);
            let byteOffset = MOVE_HEADER_SIZE;

            for(let i = 0; i < count; i++) {
                const deltaX = view.getInt8(byteOffset);
                const deltaY = view.getInt8(byteOffset + 1);
                const tileX = view.getInt16(byteOffset + 2, true);
                const tileY = view.getInt16(byteOffset + 4, true);

                plan.path.push(createStep(deltaX, deltaY, tileX, tileY));
                byteOffset += MOVE_STEP_SIZE;
            }

            return plan;
        }
        case ACTION_TYPE.MINE_TRIGGER: {
            const plan = MineTriggerAction.createData();

            plan.entityID = view.getInt16(1, true);
            plan.health = view.getUint16(3, true);
            plan.tileX = view.getInt16(5, true);
            plan.tileY = view.getInt16(7, true);

            return plan;
        }
        case ACTION_TYPE.HEAL: {
            const plan = HealAction.createData();

            plan.entityID = view.getInt16(1, true);
            plan.targetID = view.getInt16(3, true);

            const length = view.getUint16(5, true);
            let byteOffset = HEAL_HEADER_SIZE;

            for(let i = 0; i < length; i++) {
                plan.resolutions.push({
                    "entityID": view.getInt16(byteOffset, true),
                    "delta": view.getInt16(byteOffset + 2, true),
                    "health": view.getUint16(byteOffset + 4, true)
                });

                byteOffset += ENTITY_RESOLUTION_SIZE;
            }

            return plan;
        }
        case ACTION_TYPE.EXTRACT: {
            const plan = ExtractAction.createData();

            plan.entityID = view.getInt16(1, true);
            plan.value = view.getUint16(3, true);

            return plan;
        }
        case ACTION_TYPE.EXPLODE_TILE: {
            const plan = ExplodeTileAction.createData();

            plan.layer = view.getUint8(1);
            plan.tileX = view.getInt16(2, true);
            plan.tileY = view.getInt16(4, true);
            plan.entityID = view.getInt16(6, true);

            return plan;
        }
        case ACTION_TYPE.END_TURN: {
            const plan = EndTurnAction.createData();

            return plan;
        }
        case ACTION_TYPE.DEATH: {
            const plan = DeathAction.createData();
            const count = view.getUint16(1, true);
            let byteOffset = DEATH_HEADER_SIZE;

            for(let i = 0; i < count; i++) {
                plan.entities.push(view.getInt16(byteOffset, true));

                byteOffset += DEATH_BLOCK_SIZE;
            }

            return plan;
        }
        case ACTION_TYPE.CLOAK: {
            const plan = CloakAction.createData();

            plan.entityID = view.getInt16(1, true);

            return plan;
        }
        case ACTION_TYPE.CAPTURE: {
            const plan = CaptureAction.createData();

            plan.entityID = view.getInt16(1, true);
            plan.targetX = view.getInt16(3, true);
            plan.targetY = view.getInt16(5, true);

            return plan;
        }
        case ACTION_TYPE.ATTACK: {
            const plan = AttackAction.createData();

            plan.flags = view.getUint8(1);
            plan.attackerID = view.getInt16(2, true);
            plan.targetID = view.getInt16(4, true);
            plan.resourceDamage = view.getInt32(6, true);
            
            const length = view.getUint16(10, true);
            let byteOffset = ATTACK_HEADER_SIZE;

            for(let i = 0; i < length; i++) {
                plan.resolutions.push({
                    "entityID": view.getInt16(byteOffset, true),
                    "delta": view.getInt16(byteOffset + 2, true),
                    "health": view.getUint16(byteOffset + 4, true)
                });

                byteOffset += ENTITY_RESOLUTION_SIZE;
            }

            return plan;
        }
    }

    return null;
}