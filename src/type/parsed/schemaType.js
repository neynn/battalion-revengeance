export const SchemaType = function(id) {
    this.id = id;
    this.name = "MISSING_NAME_SCHEMA";
    this.desc = "MISSING_DESC_SCHEMA";
    this.colorMap = {};
}

SchemaType.prototype.load = function(config, DEBUG_NAME) {
    const {
        name = "MISSING_NAME_SCHEMA",
        desc = "MISSING_DESC_SCHEMA",
        colors = {}
    } = config;

    this.name = name;
    this.desc = desc;

    for(const colorHex in colors) {
        const colorVal = Number(colorHex);

        this.colorMap[colorVal] = colors[colorHex];
    }
}