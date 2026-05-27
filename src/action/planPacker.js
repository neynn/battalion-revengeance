import { ExecutionPlan } from "../../engine/action/executionPlan.js";
import { ACTION_TYPE } from "../enums.js";
import { ResolutionSystem } from "../systems/combat.js";
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
import { RepairVTable } from "./types/repair.js";

/**
 * 0x00 [U8] -> type
 * 
 * 0x01 [S16] -> entityID
 * 
 * 0x03 [U16] -> cost
 */
const REPAIR_HEADER_SIZE = 5;

const RepairTable = {
    getSize: function(data) {
        return REPAIR_HEADER_SIZE;
    },
    write: function(data, view, beginPtr) {
        const { entityID, cost } = data;

        view.setUint8(beginPtr + 0, ACTION_TYPE.REPAIR);
        view.setInt16(beginPtr + 1, entityID, true);
        view.setUint16(beginPtr + 3, cost, true);
    },
    read: function(view, beginPtr) {
        const data = RepairVTable.createData();

        data.entityID = view.getInt16(beginPtr + 1, true);
        data.cost = view.getUint16(beginPtr + 3, true);

        return data;
    }
};

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

const FromTransportTable = {
    getSize: function(data) {
        return FROM_TRANSPORT_HEADER_SIZE;
    },
    write: function(data, view, beginPtr) {
        const { entityID, entityTypeID, health } = data;

        view.setUint8(beginPtr + 0, ACTION_TYPE.FROM_TRANSPORT);
        view.setInt16(beginPtr + 1, entityID, true);
        view.setInt16(beginPtr + 3, entityTypeID, true);
        view.setUint16(beginPtr + 5, health, true);
    },
    read: function(view, beginPtr) {
        const data = FromTransportVTable.createData();

        data.entityID = view.getInt16(beginPtr + 1, true);
        data.entityTypeID = view.getInt16(beginPtr + 3, true);
        data.health = view.getUint16(beginPtr + 5, true);

        return data;
    }
};

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

const ToTransportTable = {
    getSize: function(data) {
        return TO_TRANSPORT_HEADER_SIZE;
    },
    write: function(data, view, beginPtr) {
        const { entityID, entityTypeID, health, cost } = data;

        view.setUint8(beginPtr + 0, ACTION_TYPE.TO_TRANSPORT);
        view.setInt16(beginPtr + 1, entityID, true);
        view.setInt16(beginPtr + 3, entityTypeID, true);
        view.setUint16(beginPtr + 5, cost, true);
        view.setUint16(beginPtr + 7, health, true);
    },
    read: function(view, beginPtr) {
        const data = ToTransportVTable.createData();
            
        data.entityID = view.getInt16(beginPtr + 1, true);
        data.entityTypeID = view.getInt16(beginPtr + 3, true);
        data.cost = view.getUint16(beginPtr + 5, true);
        data.health = view.getUint16(beginPtr + 7, true);

        return data;
    }
};

/** 
 * 0x00 [U8] -> type
 * 
 * 0x01 [U8] -> interruptType
 * 
 * 0x02 [S16] -> eventID
 */
const INTERRUPT_HEADER_SIZE = 4;

const InterruptTable = {
    getSize: function(data) {
        return INTERRUPT_HEADER_SIZE;
    },
    write: function(data, view, beginPtr) {
        const { event, type } = data;

        view.setUint8(beginPtr + 0, ACTION_TYPE.INTERRUPT);
        view.setUint8(beginPtr + 1, type);
        view.setInt16(beginPtr + 2, event, true);
    },
    read: function(view, beginPtr) {
        const data = InterruptVTable.createData();

        data.type = view.getUint8(beginPtr + 1);
        data.event = view.getInt16(beginPtr + 2, true);

        return data;
    }
};

/** 
 * 0x00 [U8] -> type
 * 
 * 0x01 [U8] -> entity_count
 * 
 * 0x02 [U8] -> mine_count
 * 
 * 0x03 [S16] -> entityID
 */
const UNCLOAK_HEADER_SIZE = 5;

const UncloakTable = {
    /**
     * 
     * @param {*} data 
     * @returns {number}
     */
    getSize: function(data) {
        return UNCLOAK_HEADER_SIZE + ENTITY_ID_SIZE * data.entities.length + MINE_SIZE * data.mines.length;
    },
    write: function(data, view, beginPtr) {
        const { entityID, entities, mines } = data;

        view.setUint8(beginPtr + 0, ACTION_TYPE.UNCLOAK);
        view.setUint8(beginPtr + 1, entities.length);
        view.setUint8(beginPtr + 2, mines.length);
        view.setInt16(beginPtr + 3, entityID, true);

        let byteOffset = beginPtr + UNCLOAK_HEADER_SIZE;

        for(let i = 0; i < entities.length; i++) {
            view.setInt16(byteOffset, entities[i], true);

            byteOffset += ENTITY_ID_SIZE;
        }

        for(let i = 0; i < mines.length; i++) {
            const { x, y } = mines[i];

            view.setInt16(byteOffset, x, true);
            view.setInt16(byteOffset + 2, y, true);

            byteOffset += MINE_SIZE;
        }
    },
    read: function(view, beginPtr) {
        const data = UncloakVTable.createData();
        const entityCount = view.getUint8(beginPtr + 1);
        const mineCount = view.getUint8(beginPtr + 2);
        
        data.entityID = view.getInt16(beginPtr + 3, true);

        let byteOffset = beginPtr + UNCLOAK_HEADER_SIZE;

        for(let i = 0; i < entityCount; i++) {
            data.entities.push(view.getInt16(byteOffset, true));
            
            byteOffset += ENTITY_ID_SIZE;
        }

        for(let i = 0; i < mineCount; i++) {
            const tileX = view.getInt16(byteOffset, true);
            const tileY = view.getInt16(byteOffset + 2, true);

            data.mines.push({
                "x": tileX,
                "y": tileY
            });

            byteOffset += MINE_SIZE;
        }

        return data;
    }
};

/**
 * 0x00 [U8] -> type
 * 
 * 0x01 [S8] -> teamID
 * 
 * 0x02 [U16] -> count
 */
const START_TURN_HEADER_SIZE = 4;

const StartTurnTable = {
    getSize: function(data) {
        return START_TURN_HEADER_SIZE + ENTITY_RESOLUTION_SIZE * data.resolutions.length;
    },
    write: function(data, view, beginPtr) {
        const { teamID, resolutions } = data;
        
        view.setUint8(beginPtr + 0, ACTION_TYPE.START_TURN);
        view.setInt8(beginPtr + 1, teamID);
        view.setUint16(beginPtr + 2, resolutions.length, true);

        let byteOffset = beginPtr + START_TURN_HEADER_SIZE;

        for(let i = 0; i < resolutions.length; i++) {
            byteOffset = packEntityResolution(resolutions[i], view, byteOffset);
        }
    },
    read: function(view, beginPtr) {
        const data = StartTurnVTable.createData();

        data.teamID = view.getInt8(beginPtr + 1);
        
        const count = view.getUint16(beginPtr + 2, true);
        let byteOffset = beginPtr + START_TURN_HEADER_SIZE;

        for(let i = 0; i < count; i++) {
            const resolution = ResolutionSystem.createEntityResolution();

            byteOffset = unpackEntityResolution(resolution, view, byteOffset);
            data.resolutions.push(resolution);
        }

        return data;
    }
};

/**
 * 0x00 [U8] -> type
 * 
 * 0x01 [S16] -> nextID
 * 
 * 0x03 [U16] -> cost
 * 
 * 0x05 [>>] -> snapshot
 */
const PURCHASE_HEADER_SIZE = 5 + ENTITY_SNAPSHOT_SIZE;

const PurchaseTable = {
    getSize: function(data) {
        return PURCHASE_HEADER_SIZE;
    },
    write: function(data, view, beginPtr) {
        const { nextID, cost, snapshot } = data;

        view.setUint8(beginPtr + 0, ACTION_TYPE.PURCHASE_ENTITY);
        view.setInt16(beginPtr + 1, nextID, true);
        view.setUint16(beginPtr + 3, cost, true);

        packEntitySnapshot(snapshot, view, beginPtr + 5);
    },
    read: function(view, beginPtr) {
        const data = PurchaseVTable.createData();

        data.nextID = view.getInt16(beginPtr + 1, true);
        data.cost = view.getUint16(beginPtr + 3, true);

        unpackEntitySnapshot(data.snapshot, view, beginPtr + 5);

        return data;
    }
};

/** 
 * 0x00 [U8] -> type
 * 
 * 0x01 [S16] -> entityID
 * 
 * 0x03 [S16] -> nextID
 * 
 * 0x05 [U16] -> cost
 * 
 * 0x07 [>>] -> snapshot
 */
const PRODUCE_HEADER_SIZE = 7 + ENTITY_SNAPSHOT_SIZE;

const ProduceTable = {
    getSize: function(data) {
        return PRODUCE_HEADER_SIZE;
    },
    write: function(data, view, beginPtr) {
        const { entityID, nextID, cost, snapshot } = data;

        view.setUint8(beginPtr + 0, ACTION_TYPE.PRODUCE_ENTITY);
        view.setInt16(beginPtr + 1, entityID, true);
        view.setInt16(beginPtr + 3, nextID, true);
        view.setUint16(beginPtr + 5, cost, true);

        packEntitySnapshot(snapshot, view, beginPtr + 7);
    },
    read: function(view, beginPtr) {
        const data = ProduceVTable.createData();

        data.entityID = view.getInt16(beginPtr + 1, true);
        data.nextID = view.getInt16(beginPtr + 3, true);
        data.cost = view.getUint16(beginPtr + 5, true);

        unpackEntitySnapshot(data.snapshot, view, beginPtr + 7);

        return data;
    }
};

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

const MoveTable = {
    getSize: function(data) {
        return MOVE_HEADER_SIZE + MOVE_STEP_SIZE * data.path.length;
    },
    write: function(data, view, beginPtr) {
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
    },
    read: function(view, beginPtr) {
        const flags = view.getUint8(beginPtr + 1);
        const entityID = view.getInt16(beginPtr + 2, true);
        const originX = view.getInt16(beginPtr + 4, true);
        const originY = view.getInt16(beginPtr + 6, true);
        const count = view.getUint16(beginPtr + 8, true);
        const data = MoveVTable.createData(count);

        data.flags = flags;
        data.entityID = entityID;
        data.originX = originX;
        data.originY = originY;
        
        let byteOffset = beginPtr + MOVE_HEADER_SIZE;

        for(let i = 0; i < count; i++) {
            byteOffset = unpackStep(data.path[i], view, byteOffset);
        }

        return data;
    }
};

/**
 * 0x00 [U8] -> type
 * 
 * 0x01 [S16] -> entityID
 * 
 * 0x03 [U16] -> health
 * 
 * 0x05 [S16] -> tileX
 * 
 * 0x07 [S16] -> tileY
 */
const MINE_TRIGGER_HEADER_SIZE = 9;

const MineTriggerTable = {
    getSize: function(data) {
        return MINE_TRIGGER_HEADER_SIZE;
    },
    write: function(data, view, beginPtr) {
        const { entityID, health, tileX, tileY } = data;

        view.setUint8(beginPtr + 0, ACTION_TYPE.MINE_TRIGGER);
        view.setInt16(beginPtr + 1, entityID, true);
        view.setUint16(beginPtr + 3, health, true);
        view.setInt16(beginPtr + 5, tileX, true);
        view.setInt16(beginPtr + 7, tileY, true);
    },
    read: function(view, beginPtr) {
        const data = MineTriggerVTable.createData();

        data.entityID = view.getInt16(beginPtr + 1, true);
        data.health = view.getUint16(beginPtr + 3, true);
        data.tileX = view.getInt16(beginPtr + 5, true);
        data.tileY = view.getInt16(beginPtr + 7, true);

        return data;
    }
};

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

const HealTable = {
    getSize: function(data) {
        return HEAL_HEADER_SIZE + ENTITY_RESOLUTION_SIZE * data.resolutions.length;
    },
    write: function(data, view, beginPtr) {
        const { entityID, targetID, resolutions } = data;

        view.setUint8(beginPtr + 0, ACTION_TYPE.HEAL);
        view.setInt16(beginPtr + 1, entityID, true);
        view.setInt16(beginPtr + 3, targetID, true);
        view.setUint16(beginPtr + 5, resolutions.length, true);

        let byteOffset = beginPtr + HEAL_HEADER_SIZE;

        for(let i = 0; i < resolutions.length; i++) {
            byteOffset = packEntityResolution(resolutions[i], view, byteOffset);
        }
    },
    read: function(view, beginPtr) {
        const data = HealVTable.createData();
        
        data.entityID = view.getInt16(beginPtr + 1, true);
        data.targetID = view.getInt16(beginPtr + 3, true);

        const count = view.getUint16(beginPtr + 5, true);
        let byteOffset = beginPtr + HEAL_HEADER_SIZE;

        for(let i = 0; i < count; i++) {
            const resolution = ResolutionSystem.createEntityResolution();

            byteOffset = unpackEntityResolution(resolution, view, byteOffset);
            data.resolutions.push(resolution);
        }

        return data;
    }
};

/**
 * 0x00 [U8] -> type
 * 
 * 0x01 [S16] -> entityID
 * 
 * 0x03 [U16] -> value
 */
const EXTRACT_ORE_HEADER_SIZE = 5;

const ExtractOreTable = {
    getSize: function(data) {
        return EXTRACT_ORE_HEADER_SIZE;
    },
    write: function(data, view, beginPtr) {
        const { entityID, value } = data;

        view.setUint8(beginPtr + 0, ACTION_TYPE.EXTRACT);
        view.setInt16(beginPtr + 1, entityID, true);
        view.setUint16(beginPtr + 3, value, true);
    },
    read: function(view, beginPtr) {
        const data = ExtractVTable.createData();
        
        data.entityID = view.getInt16(beginPtr + 1, true);
        data.value = view.getUint16(beginPtr + 3, true);

        return data;
    }
};

/**
 * 0x00 [U8] -> type
 * 
 * 0x01 [U8] -> layer
 * 
 * 0x02 [S16] -> tileX
 * 
 * 0x04 [S16] -> tileY
 * 
 * 0x06 [S16] -> entityID
 */
const EXPLODE_TILE_HEADER_SIZE = 8;

const ExplodeTileTable = {
    getSize: function(data) {
        return EXPLODE_TILE_HEADER_SIZE;
    },
    write: function(data, view, beginPtr) {
        const { entityID, layer, tileX, tileY } = data;

        view.setUint8(beginPtr + 0, ACTION_TYPE.EXPLODE_TILE);
        view.setUint8(beginPtr + 1, layer);
        view.setInt16(beginPtr + 2, tileX, true);
        view.setInt16(beginPtr + 4, tileY, true);
        view.setInt16(beginPtr + 6, entityID, true);
    },
    read: function(view, beginPtr) {
        const data = ExplodeTileVTable.createData();

        data.layer = view.getUint8(beginPtr + 1);
        data.tileX = view.getInt16(beginPtr + 2, true);
        data.tileY = view.getInt16(beginPtr + 4, true);
        data.entityID = view.getInt16(beginPtr + 6, true);

        return data;
    }
};


/**
 * 0x00 [U8] -> type
 * 
 * 0x01 [S16] -> entityID
 * 
 * 0x03 [>>] -> snapshot
 */
const ENTITY_SPAWN_HEADER_SIZE = 3 + ENTITY_SNAPSHOT_SIZE;

const EntitySpawnTable = {
    getSize: function(data) {
        return ENTITY_SPAWN_HEADER_SIZE;
    },
    write: function(data, view, beginPtr) {
        const { entityID, snapshot } = data;

        view.setUint8(beginPtr + 0, ACTION_TYPE.ENTITY_SPAWN);
        view.setInt16(beginPtr + 1, entityID, true);

        packEntitySnapshot(snapshot, view, beginPtr + 3);
    },
    read: function(view, beginPtr) {
        const data = EntitySpawnVTable.createData();

        data.entityID = view.getInt16(beginPtr + 1, true);

        unpackEntitySnapshot(data.snapshot, view, beginPtr + 3);

        return data;
    }
};


/**
 * 0x00 [U8] -> type
 */
const END_TURN_HEADER_SIZE = 1;

const EndTurnTable = {
    getSize: function(data) {
        return END_TURN_HEADER_SIZE;
    },
    write: function(data, view, beginPtr) {
        view.setUint8(beginPtr + 0, ACTION_TYPE.END_TURN);
    },
    read: function(view, beginPtr) {
        return EndTurnVTable.createData();
    }
};

/**
 * 0x00 [U8] -> type
 * 
 * 0x01 [U16] -> count
 */
const DEATH_HEADER_SIZE = 3;

const DeathTable = {
    /**
     * 
     * @param {*} data 
     * @returns {number}
     */
    getSize: function(data) {
        return DEATH_HEADER_SIZE + ENTITY_ID_SIZE + data.entities.length;
    },
    write: function(data, view, beginPtr) {
        const { entities } = data;

        view.setUint8(beginPtr + 0, ACTION_TYPE.DEATH);
        view.setUint16(beginPtr + 1, entities.length, true);

        let byteOffset = beginPtr + DEATH_HEADER_SIZE;

        for(let i = 0; i < entities.length; i++) {
            view.setInt16(byteOffset, entities[i], true);

            byteOffset += ENTITY_ID_SIZE;
        }
    },
    read: function(view, beginPtr) {
        const data = DeathActionVTable.createData();

        const count = view.getUint16(beginPtr + 1, true);
        let byteOffset = beginPtr + DEATH_HEADER_SIZE;

        for(let i = 0; i < count; i++) {
            data.entities.push(view.getInt16(byteOffset, true));

            byteOffset += ENTITY_ID_SIZE;
        }

        return data;
    }
};


/**
 * 0x00 [U8] -> type
 * 
 * 0x01 [S16] -> entityID
 */
const CLOAK_HEADER_SIZE = 3;

const CloakTable = {
    getSize: function(data) {
        return CLOAK_HEADER_SIZE;
    },
    write: function(data, view, beginPtr) {
        const { entityID } = data;

        view.setUint8(beginPtr + 0, ACTION_TYPE.CLOAK);
        view.setInt16(beginPtr + 1, entityID, true);
    },
    read: function(view, beginPtr) {
        const data = CloakActionVTable.createData();
        
        data.entityID = view.getInt16(beginPtr + 1, true);

        return data;
    }
};

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
            const resolution = ResolutionSystem.createEntityResolution();

            byteOffset = unpackEntityResolution(resolution, view, byteOffset);
            data.resolutions.push(resolution);
        }

        return data;
    }
};

const getTable = function(actionType) {
    switch(actionType) {
        case ACTION_TYPE.ATTACK: return AttackTable;
        case ACTION_TYPE.CAPTURE: return CaptureTable;
        case ACTION_TYPE.CLOAK: return CloakTable;
        case ACTION_TYPE.DEATH: return DeathTable;
        case ACTION_TYPE.END_TURN: return EndTurnTable;
        case ACTION_TYPE.ENTITY_SPAWN: return EntitySpawnTable;
        case ACTION_TYPE.EXPLODE_TILE: return ExplodeTileTable;
        case ACTION_TYPE.EXTRACT: return ExtractOreTable;
        case ACTION_TYPE.FROM_TRANSPORT: return FromTransportTable;
        case ACTION_TYPE.HEAL: return HealTable;
        case ACTION_TYPE.INTERRUPT: return InterruptTable;
        case ACTION_TYPE.MINE_TRIGGER: return MineTriggerTable;
        case ACTION_TYPE.MOVE: return MoveTable;
        case ACTION_TYPE.PRODUCE_ENTITY: return ProduceTable;
        case ACTION_TYPE.PURCHASE_ENTITY: return PurchaseTable;
        case ACTION_TYPE.START_TURN: return StartTurnTable;
        case ACTION_TYPE.TO_TRANSPORT: return ToTransportTable;
        case ACTION_TYPE.UNCLOAK: return UncloakTable;
        case ACTION_TYPE.REPAIR: return RepairTable;
        default: return null;
    }
}

/**
 * 
 * @param {ExecutionPlan} executionPlan 
 * @returns {number} Size of plan data in bytes.
 */
export const getPlanSize = function(executionPlan) {
    const { id, type, data } = executionPlan;
    const table = getTable(type);

    if(!table) {
        return 0;
    }

    return table.getSize(data);
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
    const table = getTable(type);

    if(!table) {
        return;
    }

    table.write(data, view, beginPtr);
}

/**
 * 
 * @param {DataView} view 
 * @param {number} beginPtr 
 * @returns {ExecutionPlan}
 */
export const unpackPlan = function(view, beginPtr) {
    const type = view.getUint8(beginPtr + 0);
    const table = getTable(type);
    const plan = new ExecutionPlan(-1, type);

    if(table) {
        const data = table.read(view, beginPtr);

        plan.setData(data);
    }

    return plan;
}