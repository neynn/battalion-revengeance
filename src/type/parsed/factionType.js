export const FactionType = function(id, config) {
    const {
        name = "MISSING_NAME_FACTION",
        desc = "MISSING_DESC_FACTION",
        color = "WHITE"
    } = config;

    this.id = id;
    this.name = name;
    this.desc = desc;
    this.color = color;
}