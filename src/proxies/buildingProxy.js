import { BUILDING_TYPE, COLOR_TYPE, FACTION_TYPE } from "../enums.js";

export const BuildingProxy = function() {
    this.tileX = -1;
    this.tileY = -1;
    this.typeID = BUILDING_TYPE.COMMAND_CENTER;
    this.colorID = COLOR_TYPE.BUILDING;
    this.factionID = FACTION_TYPE._INVALID;
}

BuildingProxy.prototype.fromJSON = function(data) {
    const { x = -1, y = -1, type = null } = data;

    this.tileX = x;
    this.tileY = y;
    this.typeID = BUILDING_TYPE[type] ?? BUILDING_TYPE.COMMAND_CENTER;
}