export const ArmorType = function(id, config) {
    const {
        name = ArmorType.MISSING_NAME,
        desc = ArmorType.MISSING_DESC,
        icon = null
    } = config;

    this.id = id;
    this.name = name;
    this.desc = desc;
    this.icon = icon;
}

ArmorType.MISSING_NAME = "MISSING_NAME_ARMOR";
ArmorType.MISSING_DESC = "MISSING_DESC_ARMOR";