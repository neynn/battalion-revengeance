import { LanguageHandler } from "../../engine/language/languageHandler.js";
import { BattalionEntity } from "../entity/battalionEntity.js";
import { DIRECTION, ENTITY_TYPE, MORALE_TYPE, SHOP_TYPE, TRAIT_TYPE } from "../enums.js";
import { ScenarioModel } from "../scenarioModel.js";
import { TeamManager } from "../team/teamManager.js";

export const createEntitySnapshot = function() {
    return {
        "shop": SHOP_TYPE.NONE, //UINT8
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

export const createEntitySnapshotFromEntry = function(gameContext, entry) {
    const { teamManager, typeRegistry } = gameContext;
    const {
        id,
        name,
        desc,
        type,
        x,
        y,
        direction,
        health,
        stealth,
        cash,
        cargo,
        team,
        shop
    } = entry;

    const snapshot = createEntitySnapshot();
    const entityType = typeRegistry.getEntityType(type);

    snapshot.id = id;
    snapshot.name = name;
    snapshot.desc = desc;
    snapshot.type = type;
    snapshot.health = entityType.health;
    snapshot.teamID = teamManager.getTeamID(team);
    snapshot.tileX = x;
    snapshot.tileY = y;
    snapshot.direction = direction;
    snapshot.cash = cash;
    snapshot.transport = cargo;
    snapshot.shop = shop;

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