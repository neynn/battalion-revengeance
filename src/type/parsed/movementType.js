export const MovementType = function(id, config) {
    const {
        name = MovementType.MISSING_NAME,
        desc = MovementType.MISSING_DESC,
        icon = null,
    } = config;

    this.id = id;
    this.name = name;
    this.desc = desc;
    this.icon = icon;
}

MovementType.MISSING_NAME = "MISSING_NAME_MOVEMENT";
MovementType.MISSING_DESC = "MISSING_DESC_MOVEMENT";