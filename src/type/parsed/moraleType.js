export const MoraleType = function(id, config) {
    const {
        name = MoraleType.MISSING_NAME,
        desc = MoraleType.MISSING_DESC,
        icon = null,
        damageModifier = 1
    } = config;

    this.id = id;
    this.name = name;
    this.desc = desc;
    this.icon = icon;
    this.damageModifier = damageModifier;
}

MoraleType.MISSING_NAME = "MISSING_NAME_MORALE";
MoraleType.MISSING_DESC = "MISSING_DESC_MORALE";