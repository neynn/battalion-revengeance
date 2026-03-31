import { LanguageHandler } from "../../engine/language/languageHandler.js";
import { BattalionEntity } from "../entity/battalionEntity.js";
import { DIRECTION, ENTITY_TYPE, MORALE_TYPE, TRAIT_TYPE } from "../enums.js";
import { BattalionMap } from "../map/battalionMap.js";
import { TeamManager } from "../team/teamManager.js";

export const ENTITY_SNAPSHOT_SIZE = 0;

export const createEntitySnapshot = function() {
    return {
        "type": ENTITY_TYPE._INVALID, //INT16
        "flags": BattalionEntity.FLAG.NONE, //UINT16
        "health": 1, //UINT16
        "maxHealth": 1, //UINT16
        "morale": MORALE_TYPE.NORMAL, //UINT8
        "tileX": -1, //INT16
        "tileY": -1, //INT16
        "tileZ": -1, //INT16
        "teamID": TeamManager.INVALID_ID, //INT8
        "transport": ENTITY_TYPE._INVALID, //INT16
        "direction": DIRECTION.EAST, //UINT8
        "state": BattalionEntity.STATE.IDLE, //UINT8
        "turns": 0, //UINT16
        "cash": 0, //UINT16
        "id": BattalionMap.INVALID_CUSTOM_ID, //INT16
        "name": LanguageHandler.INVALID_ID, //INT16
        "desc": LanguageHandler.INVALID_ID, //INT16
    };
}

export const createEntitySnapshotFromJSON = function(gameContext, worldMap, json) {
    const { teamManager, typeRegistry } = gameContext;
    const { 
        x = -1,
        y = -1,
        id = null,
        name = null,
        desc = null,
        type = null,
        team = null,
        direction = null,
        health = -1,
        stealth = false,
        cash = 0
    } = json;

    const snapshot = createEntitySnapshot();
    const typeID = ENTITY_TYPE[type] ?? ENTITY_TYPE._INVALID;
    const entityType = typeRegistry.getEntityType(typeID);

    snapshot.type = typeID;
    snapshot.health = entityType.health;
    snapshot.maxHealth = entityType.health;
    snapshot.teamID = teamManager.getTeamID(team);
    snapshot.tileX = x;
    snapshot.tileY = y;
    snapshot.direction = DIRECTION[direction] ?? DIRECTION.EAST;
    snapshot.cash = cash;

    if(id !== null) {
        snapshot.id = worldMap.getCustomID(id);
    }

    if(name !== null) {
        snapshot.name = worldMap.getTextID(name);
    }

    if(desc !== null) {
        snapshot.desc = worldMap.getTextID(desc);
    }

    if(health > 0) {
        snapshot.health = health;
    }

    if(stealth && entityType.hasTrait(TRAIT_TYPE.STEALTH)) {
        snapshot.flags |= BattalionEntity.FLAG.IS_CLOAKED;

        if(entityType.hasTrait(TRAIT_TYPE.SUBMERGED)) {
            snapshot.flags |= BattalionEntity.FLAG.IS_SUBMERGED;
        }
    }

    return snapshot;
}