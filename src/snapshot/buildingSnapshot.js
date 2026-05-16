import { LanguageHandler } from "../../engine/language/languageHandler.js";
import { BUILDING_TYPE, SCHEMA_TYPE, SHOP_TYPE } from "../enums.js";
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
        "color": SCHEMA_TYPE.RED,
        "shop": SHOP_TYPE.NONE
    }
}

/**
 * 
 * @param {BattalionMap} worldMap 
 * @param {*} json 
 * @returns 
 * 
 * Does not have ALL the data. The rest gets added by the loaders.
 * Shop/Team are added later.
 */
export const createBuildingSnapshotFromJSON = function(worldMap, json) {
    const {
        id = null,
        name = null,
        desc = null,
        x = -1,
        y = -1,
        type = null,
        color = null
    } = json;

    const snapshot = createBuildingSnapshot();
    const typeID = BUILDING_TYPE[type] ?? BUILDING_TYPE.AIR_CONTROL;

    snapshot.type = typeID;
    snapshot.tileX = x;
    snapshot.tileY = y;

    if(id !== null) {
        snapshot.id = worldMap.getCustomID(id);
    }

    if(name !== null) {
        snapshot.name = worldMap.getTextID(name);
    }

    if(desc !== null) {
        snapshot.desc = worldMap.getTextID(desc);
    }

    if(color !== null) {
        snapshot.color = SCHEMA_TYPE[color] ?? SCHEMA_TYPE.RED;
    }

    return snapshot;
}