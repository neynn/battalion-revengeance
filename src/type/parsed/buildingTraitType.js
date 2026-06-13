import { ICON_TYPE } from "../../enums.js";

export const BuildingTraitType = function(id) {
    this.id = id;
    this.name = "MISSING_NAME_BUILDING_TYPE";
    this.desc = "MISSING_DESC_BUILDING_TYPE";
    this.icon = ICON_TYPE.NONE;
    this.cashPerTurn = 0;
}

BuildingTraitType.prototype.load = function(config, DEBUG_NAME) {
    const { 
        name = "MISSING_NAME_BUILDING_TYPE",
        desc = "MISSING_DESC_BUILDING_TYPE",
        icon = "NONE",
        cashPerTurn = 0
    } = config;

    this.name = name;
    this.desc = desc;
    this.icon = ICON_TYPE[icon] ?? ICON_TYPE.NONE;
    this.cashPerTurn = cashPerTurn;
}