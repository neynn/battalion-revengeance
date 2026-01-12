export const WeaponType = function(id, config) {
    const {
        name = "MISSING_NAME_WEAPON",
        desc = "MISSING_DESC_WEAPON",
        icon = null
    } = config;

    this.id = id;
    this.name = name;
    this.desc = desc;
    this.icon = icon;
}