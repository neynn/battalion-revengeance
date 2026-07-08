import { LanguageHandler } from "../../engine/language/languageHandler.js";
import { BattalionEntity } from "../entity/battalionEntity.js";
import { DIRECTION, ENTITY_TYPE, MORALE_TYPE, SHOP_TYPE } from "../enums.js";
import { ScenarioModel } from "../scenario/scenarioModel.js";
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