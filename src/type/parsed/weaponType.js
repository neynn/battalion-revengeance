export const WeaponType = function(id) {
    this.id = id;
    this.name = "MISSING_NAME_WEAPON";
    this.desc = "MISSING_DESC_WEAPON";
    this.icon = null;
}

WeaponType.prototype.load = function(config, DEBUG_NAME) {
    const {
        name = "MISSING_NAME_WEAPON",
        desc = "MISSING_DESC_WEAPON",
        icon = null
    } = config;

    this.name = name;
    this.desc = desc;
    this.icon = icon;
}