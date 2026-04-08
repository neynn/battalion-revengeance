import { CURRENCY_TYPE, EMBLEM_TYPE, FACTION_TYPE, POWER_TYPE } from "../../enums.js";

export const NationType = function(id) {
    this.id = id;
    this.name = "MISSING_NAME_NATION";
    this.desc = "MISSING_DESC_NATION";
    this.prefix = "PREFIX";
    this.faction = FACTION_TYPE.RED;
    this.power = POWER_TYPE.MINOR;
    this.currency = CURRENCY_TYPE.NONE;
    this.emblem = EMBLEM_TYPE.POLASIE;
    this.nonEmblem = EMBLEM_TYPE.POLASIE_NO;
}

NationType.prototype.load = function(config, DEBUG_NAME) {
    const {
        name = "MISSING_NAME_NATION",
        desc = "MISSING_DESC_NATION",
        prefix = "PREFIX",
        faction = "NONE",
        power = "NONE",
        currency = "NONE",
        emblem = null,
        nonEmblem = null
    } = config;

    this.name = name;
    this.desc = desc;
    this.prefix = prefix;
    this.faction = FACTION_TYPE[faction] ?? FACTION_TYPE.RED;
    this.power = POWER_TYPE[power] ?? POWER_TYPE.MINOR;
    this.currency = CURRENCY_TYPE[currency] ?? CURRENCY_TYPE.NONE;
    this.emblem = EMBLEM_TYPE[emblem] ?? EMBLEM_TYPE.POLASIE;
    this.nonEmblem = EMBLEM_TYPE[nonEmblem] ?? EMBLEM_TYPE.POLASIE_NO;
}