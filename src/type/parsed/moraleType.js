export const MoraleType = function(id) {
    this.id = id;
    this.name = "MISSING_NAME_MORALE";
    this.desc = "MISSING_DESC_MORALE";
    this.icon = null;
    this.damageModifier = 1;
}

MoraleType.prototype.load = function(config, DEBUG_NAME) {
    const {
        name = "MISSING_NAME_MORALE",
        desc = "MISSING_DESC_MORALE",
        icon = null,
        damageModifier = 1
    } = config;

    this.name = name;
    this.desc = desc;
    this.icon = icon;
    this.damageModifier = damageModifier;
}