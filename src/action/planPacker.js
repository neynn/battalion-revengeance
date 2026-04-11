import { ExecutionPlan } from "../../engine/action/executionPlan.js";
import { ACTION_TYPE } from "../enums.js";
import { createStep } from "../systems/pathfinding.js";
import { createEntityResolution } from "./interactionResolver.js";
import { ENTITY_RESOLUTION_SIZE, ENTITY_SNAPSHOT_SIZE, MOVE_STEP_SIZE, packEntityResolution, packEntitySnapshot, unpackEntityResolution, unpackEntitySnapshot } from "./packer_constants.js";
import { AttackAction } from "./types/attack.js";
import { CaptureAction } from "./types/capture.js";
import { CloakAction } from "./types/cloak.js";
import { DeathAction } from "./types/death.js";
import { EndTurnAction } from "./types/endTurn.js";
import { EntitySpawnAction } from "./types/entitySpawn.js";
import { ExplodeTileAction } from "./types/explodeTile.js";
import { ExtractAction } from "./types/extract.js";
import { HealAction } from "./types/heal.js";
import { MineTriggerAction } from "./types/mineTrigger.js";
import { MoveAction } from "./types/move.js";
import { ProduceEntityAction } from "./types/produceEntity.js";
import { PurchaseEntityAction } from "./types/purchaseEntity.js";
import { InterruptAction } from "./types/interrupt.js";
import { StartTurnAction } from "./types/startTurn.js";
import { UncloakAction } from "./types/uncloak.js";

/*
    0x00 -> type,
    0x01 -> interruptType,
    0x02 -> eventID
*/
const INTERRUPT_HEADER_SIZE = 4;

export const packInterruptPlan = function(data) {
    const { event, type } = data;
    const buffer = new ArrayBuffer(INTERRUPT_HEADER_SIZE);
    const view = new DataView(buffer);

    view.setUint8(0, ACTION_TYPE.INTERRUPT);
    view.setUint8(1, type);
    view.setInt16(2, event, true);

    return buffer;
}

/*
    0x00 -> type,
    0x01 -> entity_count
    0x02 -> mine_count,
    0x03 -> entityID
*/
const UNCLOAK_HEADER_SIZE = 5;

export const packUncloakPlan = function(data) {
    const { entityID, entities, mines } = data;
    const BUFFER_SIZE = UNCLOAK_HEADER_SIZE + 2 * entities.length + 4 * mines.length;
    const buffer = new ArrayBuffer(BUFFER_SIZE);
    const view = new DataView(buffer);

    view.setUint8(0, ACTION_TYPE.UNCLOAK);
    view.setUint8(1, entities.length);
    view.setUint8(2, mines.length);
    view.setInt16(3, entityID, true);

    let byteOffset = UNCLOAK_HEADER_SIZE;

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

    return buffer;
}

/*
    0x00 -> type,
    0x01 -> teamID,
    0x02 -> count
*/
const START_TURN_HEADER_SIZE = 4;

export const packStartTurnPlan = function(data) {
    const { teamID, resolutions } = data;
    const BUFFER_SIZE = START_TURN_HEADER_SIZE + ENTITY_RESOLUTION_SIZE * resolutions.length;
    const buffer = new ArrayBuffer(BUFFER_SIZE);
    const view = new DataView(buffer);
    
    view.setUint8(0, ACTION_TYPE.START_TURN);
    view.setInt8(1, teamID);
    view.setUint16(2, resolutions.length, true);

    let byteOffset = START_TURN_HEADER_SIZE;

    for(let i = 0; i < resolutions.length; i++) {
        byteOffset = packEntityResolution(resolutions[i], view, byteOffset);
    }

    return buffer;
}

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
        byteOffset = packEntityResolution(resolutions[i], view, byteOffset);
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
    0x01 -> entityID,
    0x03 -> snapshot
*/
const ENTITY_SPAWN_HEADER_SIZE = 3 + ENTITY_SNAPSHOT_SIZE;

export const packEntitySpawnPlan = function(data) {
    const { entityID, snapshot } = data;
    const buffer = new ArrayBuffer(ENTITY_SPAWN_HEADER_SIZE);
    const view = new DataView(buffer);

    view.setUint8(0, ACTION_TYPE.ENTITY_SPAWN);
    view.setInt16(1, entityID, true);

    packEntitySnapshot(snapshot, view, 3);

    return buffer;
}

/*
    0x00 -> type
*/
const END_TURN_HEADER_SIZE = 1;

export const packEndTurnPlan = function(data) {
    const buffer = new ArrayBuffer(END_TURN_HEADER_SIZE);
    const view = new DataView(buffer);

    view.setUint8(0, ACTION_TYPE.END_TURN);

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
        byteOffset = packEntityResolution(resolutions[i], view, byteOffset);
    }

    return buffer;
}

export const unpackPlan = function(buffer) {
    const view = new DataView(buffer);
    const type = view.getUint8(0);
    const plan = new ExecutionPlan(-1, type);
    let data = null;

    switch(type) {
        case ACTION_TYPE.INTERRUPT: {
            data = InterruptAction.createData();
            data.type = view.getUint8(1);
            data.event = view.getInt16(2, true);
            break;
        }
        case ACTION_TYPE.UNCLOAK: {
            data = UncloakAction.createData();

            const entityCount = view.getUint8(1);
            const mineCount = view.getUint8(2);
            
            data.entityID = view.getInt16(3, true);

            let byteOffset = UNCLOAK_HEADER_SIZE;

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
            data = StartTurnAction.createData();

            data.teamID = view.getInt8(1);
            
            const count = view.getUint16(2, true);
            let byteOffset = START_TURN_HEADER_SIZE;

            for(let i = 0; i < count; i++) {
                const resolution = createEntityResolution();

                byteOffset = unpackEntityResolution(resolution, view, byteOffset);
                data.resolutions.push(resolution);
            }

            break;
        }
        case ACTION_TYPE.PURCHASE_ENTITY: {
            data = PurchaseEntityAction.createData();
            data.nextID = view.getInt16(1, true);
            data.cost = view.getUint16(3, true);
            unpackEntitySnapshot(data.snapshot, view, 5);
            break;
        }
        case ACTION_TYPE.PRODUCE_ENTITY: {
            data = ProduceEntityAction.createData();
            data.entityID = view.getInt16(1, true);
            data.nextID = view.getInt16(3, true);
            data.cost = view.getUint16(5, true);
            unpackEntitySnapshot(data.snapshot, view, 7);
            break;
        }
        case ACTION_TYPE.MOVE: {
            data = MoveAction.createData();
            data.flags = view.getUint8(1);
            data.entityID = view.getInt16(2, true);

            const count = view.getUint16(4, true);
            let byteOffset = MOVE_HEADER_SIZE;

            for(let i = 0; i < count; i++) {
                const deltaX = view.getInt8(byteOffset);
                const deltaY = view.getInt8(byteOffset + 1);
                const tileX = view.getInt16(byteOffset + 2, true);
                const tileY = view.getInt16(byteOffset + 4, true);

                data.path.push(createStep(deltaX, deltaY, tileX, tileY));
                byteOffset += MOVE_STEP_SIZE;
            }

            break;
        }
        case ACTION_TYPE.MINE_TRIGGER: {
            data = MineTriggerAction.createData();
            data.entityID = view.getInt16(1, true);
            data.health = view.getUint16(3, true);
            data.tileX = view.getInt16(5, true);
            data.tileY = view.getInt16(7, true);
            break;
        }
        case ACTION_TYPE.HEAL: {
            data = HealAction.createData();
            data.entityID = view.getInt16(1, true);
            data.targetID = view.getInt16(3, true);

            const count = view.getUint16(5, true);
            let byteOffset = HEAL_HEADER_SIZE;

            for(let i = 0; i < count; i++) {
                const resolution = createEntityResolution();

                byteOffset = unpackEntityResolution(resolution, view, byteOffset);
                data.resolutions.push(resolution);
            }

            break;
        }
        case ACTION_TYPE.EXTRACT: {
            data = ExtractAction.createData();
            data.entityID = view.getInt16(1, true);
            data.value = view.getUint16(3, true);
            break;
        }
        case ACTION_TYPE.EXPLODE_TILE: {
            data = ExplodeTileAction.createData();
            data.layer = view.getUint8(1);
            data.tileX = view.getInt16(2, true);
            data.tileY = view.getInt16(4, true);
            data.entityID = view.getInt16(6, true);
            break;
        }
        case ACTION_TYPE.ENTITY_SPAWN: {
            data = EntitySpawnAction.createData();
            data.entityID = view.getInt16(1, true);
            unpackEntitySnapshot(data.snapshot, view, 3);
            break;
        }
        case ACTION_TYPE.END_TURN: {
            data = EndTurnAction.createData();
            break;
        }
        case ACTION_TYPE.DEATH: {
            data = DeathAction.createData();

            const count = view.getUint16(1, true);
            let byteOffset = DEATH_HEADER_SIZE;

            for(let i = 0; i < count; i++) {
                data.entities.push(view.getInt16(byteOffset, true));

                byteOffset += DEATH_BLOCK_SIZE;
            }

            break;
        }
        case ACTION_TYPE.CLOAK: {
            data = CloakAction.createData();
            data.entityID = view.getInt16(1, true);
            break;
        }
        case ACTION_TYPE.CAPTURE: {
            data = CaptureAction.createData();
            data.entityID = view.getInt16(1, true);
            data.targetX = view.getInt16(3, true);
            data.targetY = view.getInt16(5, true);
            break;
        }
        case ACTION_TYPE.ATTACK: {
            data = AttackAction.createData();
            data.flags = view.getUint8(1);
            data.attackerID = view.getInt16(2, true);
            data.targetID = view.getInt16(4, true);
            data.resourceDamage = view.getInt32(6, true);
            
            const count = view.getUint16(10, true);
            let byteOffset = ATTACK_HEADER_SIZE;

            for(let i = 0; i < count; i++) {
                const resolution = createEntityResolution();

                byteOffset = unpackEntityResolution(resolution, view, byteOffset);
                data.resolutions.push(resolution);
            }

            break;
        }
    }

    plan.setData(data);

    return plan;
}