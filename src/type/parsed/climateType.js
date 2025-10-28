export const ClimateType = function(id, config) {
    const {
        name = ClimateType.MISSING_NAME,
        desc = ClimateType.MISSING_DESC,
        icon = null,
        logisticFactor = 1
    } = config;

    this.id = id;
    this.name = name;
    this.desc = desc;
    this.icon = icon;
    this.logisticFactor = logisticFactor;
}

ClimateType.MISSING_NAME = "MISSING_NAME_CLIMATE";
ClimateType.MISSING_DESC = "MISSING_DESC_CLIMATE";