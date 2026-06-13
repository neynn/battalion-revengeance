import { LanguageHandler } from "../../engine/language/languageHandler.js";
import { BUILDING_TYPE, SHOP_TYPE } from "../enums.js";
import { BattalionMap } from "../map/battalionMap.js";
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

export const createBuildingSnapshotFromJSON = function(json) {
    const {
        x = -1,
        y = -1,
        type = null
    } = json;

    const snapshot = createBuildingSnapshot();
    const typeID = BUILDING_TYPE[type] ?? BUILDING_TYPE.COMMAND_CENTER;

    snapshot.type = typeID;
    snapshot.tileX = x;
    snapshot.tileY = y;

    return snapshot;
}