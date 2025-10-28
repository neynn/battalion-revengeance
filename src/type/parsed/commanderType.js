export const CommanderType = function(id, config) {
    const {
        name = CommanderType.MISSING_NAME,
        desc = CommanderType.MISSING_DESC,
        portrait = null
    } = config;

    this.id = id;
    this.name = name;
    this.desc = desc;
    this.portrait = portrait;
}

CommanderType.MISSING_NAME = "MISSING_NAME_COMMANDER";
CommanderType.MISSING_DESC = "MISSING_DESC_COMMANDER";