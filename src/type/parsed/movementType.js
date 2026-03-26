import { ICON_TYPE } from "../../enums.js";

export const MovementType = function(id) {
    this.id = id;
    this.name = "MISSING_NAME_MOVEMENT";
    this.desc = "MISSING_DESC_MOVEMENT";
    this.icon = ICON_TYPE.NONE;
}

MovementType.prototype.load = function(config, DEBUG_NAME) {
    const {
        name = "MISSING_NAME_MOVEMENT",
        desc = "MISSING_DESC_MOVEMENT",
        icon = "NONE",
    } = config;

    this.name = name;
    this.desc = desc;
    this.icon = ICON_TYPE[icon] ?? ICON_TYPE.NONE;
}