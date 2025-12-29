export const MoraleType = function(id, config) {
    const {
        name = "MISSING_NAME_MORALE",
        desc = "MISSING_DESC_MORALE",
        icon = null,
        damageModifier = 1
    } = config;

    this.id = id;
    this.name = name;
    this.desc = desc;
    this.icon = icon;
    this.damageModifier = damageModifier;
}