export const ClimateType = function(id) {
    this.id = id;
    this.name = "MISSING_NAME_CLIMATE";
    this.desc = "MISSING_DESC_CLIMATE";
    this.icon = null;
    this.logisticFactor = 1;
}

ClimateType.prototype.load = function(config) {
    const {
        name = "MISSING_NAME_CLIMATE",
        desc = "MISSING_DESC_CLIMATE",
        icon = null,
        logisticFactor = 1
    } = config;

    this.name = name;
    this.desc = desc;
    this.icon = icon;
    this.logisticFactor = logisticFactor;
}