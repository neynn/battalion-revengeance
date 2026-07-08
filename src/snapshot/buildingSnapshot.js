import { LanguageHandler } from "../../engine/language/languageHandler.js";
import { BUILDING_TYPE, SHOP_TYPE } from "../enums.js";
import { ScenarioModel } from "../scenario/scenarioModel.js";
import { TeamManager } from "../team/teamManager.js";

export const createBuildingSnapshot = function() {
    return {
        "type": BUILDING_TYPE.COMMAND_CENTER,
        "teamID": TeamManager.INVALID_ID,
        "tileX": -1,
        "tileY": -1,
        "id": ScenarioModel.INVALID_CUSTOM_ID,
        "desc": LanguageHandler.INVALID_ID,
        "name": LanguageHandler.INVALID_ID,
        "totalGeneratedCash": 0,
        "shop": SHOP_TYPE.NONE
    }
}