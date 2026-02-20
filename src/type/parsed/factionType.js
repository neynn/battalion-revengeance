import { COLOR_TYPE, CURRENCY_TYPE } from "../../enums.js";

export const FactionType = function(id, config) {
    const {
        name = "MISSING_NAME_FACTION",
        desc = "MISSING_DESC_FACTION",
        color = COLOR_TYPE.WHITE,
        currency = "NONE"
    } = config;

    this.id = id;
    this.name = name;
    this.desc = desc;
    this.color = color;
    this.currency = CURRENCY_TYPE[currency] ?? CURRENCY_TYPE.NONE;
}