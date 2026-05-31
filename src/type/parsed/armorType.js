import { ICON_TYPE } from "../../enums.js";

export const ArmorType = function(id) {
    this.id = id;
    this.name = "MISSING_NAME_ARMOR";
    this.desc = "MISSING_DESC_ARMOR";
    this.icon = ICON_TYPE.NONE;
}

ArmorType.prototype.load = function(config, DEBUG_NAME) {
    const {
        name = "MISSING_NAME_ARMOR",
        desc = "MISSING_DESC_ARMOR",
        icon = "NONE",
    } = config;

    this.name = name;
    this.desc = desc;
    this.icon = ICON_TYPE[icon] ?? ICON_TYPE.NONE;
}