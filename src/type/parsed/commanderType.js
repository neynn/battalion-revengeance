export const CommanderType = function(id, config) {
    const {
        name = "MISSING_NAME_COMMANDER",
        desc = "MISSING_DESC_COMMANDER",
        portrait = null
    } = config;

    this.id = id;
    this.name = name;
    this.desc = desc;
    this.portrait = portrait;
}