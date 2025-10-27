export const WeaponType = function(id, config) {
    const {
        name = WeaponType.MISSING_NAME,
        desc = WeaponType.MISSING_DESC,
        icon = null,
        armorResistance = {}
    } = config;

    this.id = id;
    this.name = name;
    this.desc = desc;
    this.icon = icon;
    this.armorResistance = armorResistance;
}

WeaponType.MISSING_NAME = "MISSING_NAME_WEAPON";
WeaponType.MISSING_DESC = "MISSING_DESC_WEAPON";