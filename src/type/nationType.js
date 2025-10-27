export const NationType = function(id, config) {
    const {
        name = NationType.MISSING_NAME,
        desc = NationType.MISSING_DESC,
        prefix = "PREFIX",
        faction = "NONE",
        power = "NONE",
        color = "WHITE",
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

NationType.MISSING_NAME = "MISSING_NAME_NATION";
NationType.MISSING_DESC = "MISSING_DESC_NATION";