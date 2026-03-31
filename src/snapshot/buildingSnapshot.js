import { LanguageHandler } from "../../engine/language/languageHandler.js";
import { BUILDING_TYPE, SCHEMA_TYPE } from "../enums.js";
import { BattalionMap } from "../map/battalionMap.js";
import { TeamManager } from "../team/teamManager.js";

export const createBuildingSnapshot = function() {
    return {
        "type": BUILDING_TYPE.AIR_CONTROL,
        "teamID": TeamManager.INVALID_ID,
        "tileX": -1,
        "tileY": -1,
        "id": BattalionMap.INVALID_CUSTOM_ID,
        "desc": LanguageHandler.INVALID_ID,
        "name": LanguageHandler.INVALID_ID,
        "totalGeneratedCash": 0,
        "color": SCHEMA_TYPE.RED
    }
}