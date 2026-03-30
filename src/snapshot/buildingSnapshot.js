import { BUILDING_TYPE, SCHEMA_TYPE } from "../enums.js";
import { TeamManager } from "../team/teamManager.js";

export const createBuildingSnapshot = function() {
    return {
        "type": BUILDING_TYPE.AIR_CONTROL,
        "teamID": TeamManager.INVALID_ID,
        "tileX": -1,
        "tileY": -1,
        "id": null,
        "desc": null,
        "name": null,
        "totalGeneratedCash": 0,
        "color": SCHEMA_TYPE.RED
    }
}