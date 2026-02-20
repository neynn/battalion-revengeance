export const PowerType = function(id) {
    this.id = id;
    this.name = "MISSING_NAME_POWER";
    this.desc = "MISSING_DESC_POWER";
}

PowerType.prototype.load = function(config) {
    const { name,desc } = config;

    if(name !== undefined) {
        this.name = name;
    }

    if(desc !== undefined) {
        this.desc = desc;
    }
}