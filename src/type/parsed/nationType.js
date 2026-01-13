import { COLOR_TYPE } from "../../enums.js";

export const NationType = function(id, config) {
    const {
        name = "MISSING_NAME_NATION",
        desc = "MISSING_DESC_NATION",
        prefix = "PREFIX",
        faction = "NONE",
        power = "NONE",
        color = COLOR_TYPE.WHITE,
        currency = "NONE"
    } = config;

    this.id = id;
    this.name = name;
    this.desc = desc;
    this.prefix = prefix;
    this.faction = faction;
    this.power = power;
    this.color = color;
    this.currency = currency;
}