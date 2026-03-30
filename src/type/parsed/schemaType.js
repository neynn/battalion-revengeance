export const SchemaType = function(id) {
    this.id = id;
    this.colorMap = {};
}

SchemaType.prototype.reset = function() {
    this.colorMap = {};
}

SchemaType.prototype.loadCustom = function(colors) {
    for(const colorHex in colors) {
        const colorVal = Number(colorHex);

        this.colorMap[colorVal] = colors[colorHex];
    }
}

SchemaType.prototype.load = function(config, DEBUG_NAME) {
    const {
        colors = {}
    } = config;

    for(const colorHex in colors) {
        const colorVal = Number(colorHex);

        this.colorMap[colorVal] = colors[colorHex];
    }
}