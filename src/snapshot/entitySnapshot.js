import { BattalionEntity } from "../entity/battalionEntity.js";
import { DIRECTION, ENTITY_TYPE, MORALE_TYPE, TRAIT_TYPE } from "../enums.js";
import { TeamManager } from "../team/teamManager.js";

export const createEntitySnapshot = function() {
    return {
        "type": ENTITY_TYPE._INVALID,
        "flags": BattalionEntity.FLAG.NONE,
        "health": 1,
        "maxHealth": 1,
        "morale": MORALE_TYPE.NORMAL,
        "tileX": -1,
        "tileY": -1,
        "tileZ": -1,
        "teamID": TeamManager.INVALID_ID,
        "transport": ENTITY_TYPE._INVALID,
        "direction": DIRECTION.EAST,
        "state": BattalionEntity.STATE.IDLE,
        "turns": 0,
        "cash": 0,
        "id": null,
        "name": null,
        "desc": null,
    };
}

export const createEntitySnapshotFromJSON = function(gameContext, json) {
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
    snapshot.id = id;
    snapshot.name = name;
    snapshot.desc = desc;

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