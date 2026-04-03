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

export const createBuildingSnapshotFromJSON = function(gameContext, worldMap, json) {
    const { teamManager } = gameContext;
    const {
        id = null,
        name = null,
        desc = null,
        x = -1,
        y = -1,
        type = null,
        team = null,
        color = null,
        shop = null
    } = json;

    const snapshot = createBuildingSnapshot();
    const typeID = BUILDING_TYPE[type] ?? BUILDING_TYPE.AIR_CONTROL;

    snapshot.type = typeID;
    snapshot.teamID = teamManager.getTeamID(team);
    snapshot.tileX = x;
    snapshot.tileY = y;
    snapshot.shop = SHOP_TYPE[shop] ?? SHOP_TYPE.NONE;

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
    } else if(snapshot.teamID !== TeamManager.INVALID_ID) {
        snapshot.color = teamManager.getTeam(snapshot.teamID).color;
    }

    return snapshot;
}