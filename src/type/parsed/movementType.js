export const MovementType = function(id, config) {
    const {
        name = "MISSING_NAME_MOVEMENT",
        desc = "MISSING_DESC_MOVEMENT",
        icon = null,
    } = config;

    this.id = id;
    this.name = name;
    this.desc = desc;
    this.icon = icon;
}