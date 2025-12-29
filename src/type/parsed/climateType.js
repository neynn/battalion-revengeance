export const ClimateType = function(id, config) {
    const {
        name = "MISSING_NAME_CLIMATE",
        desc = "MISSING_DESC_CLIMATE",
        icon = null,
        logisticFactor = 1
    } = config;

    this.id = id;
    this.name = name;
    this.desc = desc;
    this.icon = icon;
    this.logisticFactor = logisticFactor;
}