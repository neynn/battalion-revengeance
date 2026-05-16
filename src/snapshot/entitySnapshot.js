import { LanguageHandler } from "../../engine/language/languageHandler.js";
import { BattalionEntity } from "../entity/battalionEntity.js";
import { DIRECTION, ENTITY_TYPE, MORALE_TYPE, TRAIT_TYPE } from "../enums.js";
import { ScenarioModel } from "../scenarioModel.js";
import { TeamManager } from "../team/teamManager.js";

export const createEntitySnapshot = function() {
    return {
        "doneMoves": 0, //UINT8
        "doneActions": 0, //UINT8
        "allowedMoves": 0, //UINT8
        "allowedActions": 0, //UINT8
        "bonusMoves": 0, //UINT8
        "bonusActions": 0, //UINT8
        "direction": DIRECTION.EAST, //UINT8
        "state": BattalionEntity.STATE.IDLE, //UINT8
        "morale": MORALE_TYPE.NORMAL, //UINT8
        "moraleDelta": 0, //INT8
        "teamID": TeamManager.INVALID_ID, //INT8
        "turns": 0, //UINT16
        "cash": 0, //UINT16
        "flags": BattalionEntity.FLAG.NONE, //UINT16
        "health": 1, //UINT16
        "maxHealth": 1, //UINT16
        "type": ENTITY_TYPE._INVALID, //INT16
        "tileX": -1, //INT16
        "tileY": -1, //INT16
        "tileZ": -1, //INT16
        "transport": ENTITY_TYPE._INVALID, //INT16
        "id": ScenarioModel.INVALID_CUSTOM_ID, //INT16
        "name": LanguageHandler.INVALID_ID, //INT16
        "desc": LanguageHandler.INVALID_ID, //INT16
    };
}

export const createEntitySnapshotFromJSON = function(gameContext, worldMap, json) {
    const { teamManager, typeRegistry } = gameContext;
    const { 
        id, //Is set by ScenarioModel.
        x = -1,
        y = -1,
        name = null,
        desc = null,
        type = null,
        team = null,
        direction = null,
        health = -1,
        stealth = false,
        cash = 0,
        cargo = null
    } = json;

    const snapshot = createEntitySnapshot();
    const typeID = ENTITY_TYPE[type] ?? ENTITY_TYPE._INVALID;
    const entityType = typeRegistry.getEntityType(typeID);

    snapshot.id = id;
    snapshot.type = typeID;
    snapshot.health = entityType.health;
    snapshot.maxHealth = entityType.health;
    snapshot.teamID = teamManager.getTeamID(team);
    snapshot.tileX = x;
    snapshot.tileY = y;
    snapshot.direction = DIRECTION[direction] ?? DIRECTION.EAST;
    snapshot.cash = cash;

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

    if(cargo !== null) {
        snapshot.transport = ENTITY_TYPE[cargo] ?? ENTITY_TYPE._INVALID;
    }

    return snapshot;
}