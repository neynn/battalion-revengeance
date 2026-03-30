import { Mine } from "../entity/mine.js";
import { MINE_TYPE } from "../enums.js";
import { TeamManager } from "../team/teamManager.js";

export const createMineSnapshot = function() {
    return {
        "type": MINE_TYPE.LAND,
        "tileX": -1,
        "tileY": -1,
        "teamID": TeamManager.INVALID_ID,
        "state": Mine.STATE.HIDDEN
    }
}