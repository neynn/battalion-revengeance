export const SchemaType = function(id, config) {
    const {
        name = "MISSING_NAME_SCHEMA",
        desc = "MISSING_DESC_SCHEMA",
        colors = {}
    } = config;

    this.id = id;
    this.name = name;
    this.desc = desc;
    this.colorMap = {};

    for(const colorHex in colors) {
        const colorVal = Number(colorHex);

        this.colorMap[colorVal] = colors[colorHex];
    }
}