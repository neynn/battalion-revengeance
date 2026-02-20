export const ArmorType = function(id) {
    this.id = id;
    this.name = "MISSING_NAME_ARMOR";
    this.desc = "MISSING_DESC_ARMOR";
    this.icon = null;
    this.resistance = {};
}

ArmorType.prototype.load = function(config) {
    const {
        name = "MISSING_NAME_ARMOR",
        desc = "MISSING_DESC_ARMOR",
        icon = null,
        resistance = {}
    } = config;

    this.name = name;
    this.desc = desc;
    this.icon = icon;
    this.resistance = resistance;
}

ArmorType.prototype.getResistance = function(weaponType) {
   return this.resistance[weaponType] ?? this.resistance['*'] ?? 0;
}