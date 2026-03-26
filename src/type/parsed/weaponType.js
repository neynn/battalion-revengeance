import { ICON_TYPE } from "../../enums.js";

export const WeaponType = function(id) {
    this.id = id;
    this.name = "MISSING_NAME_WEAPON";
    this.desc = "MISSING_DESC_WEAPON";
    this.icon = ICON_TYPE.NONE;
}

WeaponType.prototype.load = function(config, DEBUG_NAME) {
    const {
        name = "MISSING_NAME_WEAPON",
        desc = "MISSING_DESC_WEAPON",
        icon = "NONE"
    } = config;

    this.name = name;
    this.desc = desc;
    this.icon = ICON_TYPE[icon] ?? ICON_TYPE.NONE;
}