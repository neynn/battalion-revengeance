import { COLOR_TYPE, CURRENCY_TYPE } from "../../enums.js";

export const FactionType = function(id) {
    this.id = id;
    this.name = "MISSING_NAME_FACTION";
    this.desc = "MISSING_DESC_FACTION";
    this.color = COLOR_TYPE.RED;
    this.currency = CURRENCY_TYPE.NONE;
}

FactionType.prototype.load = function(config, DEBUG_NAME) {
    const {
        name = "MISSING_NAME_FACTION",
        desc = "MISSING_DESC_FACTION",
        color = "RED",
        currency = "NONE"
    } = config;

    this.name = name;
    this.desc = desc;
    this.color = color;
    this.currency = CURRENCY_TYPE[currency] ?? CURRENCY_TYPE.NONE;
}