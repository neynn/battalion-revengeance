export const ArmorType = function(id, config) {
    const {
        name = "MISSING_NAME_ARMOR",
        desc = "MISSING_DESC_ARMOR",
        icon = null,
        resistance = {}
    } = config;

    this.id = id;
    this.name = name;
    this.desc = desc;
    this.icon = icon;
    this.resistance = resistance;
}