import { PORTRAIT_TYPE } from "../../enums.js";

export const CommanderType = function(id) {
    this.id = id;
    this.name = "MISSING_NAME_COMMANDER";
    this.desc = "MISSING_DESC_COMMANDER";
    this.portrait = PORTRAIT_TYPE.NONE;
}

CommanderType.prototype.load = function(config, DEBUG_NAME) {
    const {
        name = "MISSING_NAME_COMMANDER",
        desc = "MISSING_DESC_COMMANDER",
        portrait = "NONE"
    } = config;

    this.name = name;
    this.desc = desc;
    this.portrait = PORTRAIT_TYPE[portrait] ?? PORTRAIT_TYPE.NONE; 
}