export const MovementType = function(id) {
    this.id = id;
    this.name = "MISSING_NAME_MOVEMENT";
    this.desc = "MISSING_DESC_MOVEMENT";
    this.icon = null;
}

MovementType.prototype.load = function(config, DEBUG_NAME) {
    const {
        name = "MISSING_NAME_MOVEMENT",
        desc = "MISSING_DESC_MOVEMENT",
        icon = null,
    } = config;

    this.name = name;
    this.desc = desc;
    this.icon = icon;
}