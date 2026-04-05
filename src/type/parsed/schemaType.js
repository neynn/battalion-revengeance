import { getRGBAStringByArray } from "../../../engine/graphics/colorHelper.js";

export const SchemaType = function(id) {
    this.id = id;
    this.colorMap = {};
    this.hudColor = "#222222";
    this.textColor = "#eeeeee";
}

SchemaType.prototype.reset = function() {
    this.colorMap = {};
    this.hudColor = "#222222";
    this.textColor = "#eeeeee";
}

SchemaType.prototype.loadCustom = function(colors) {
    for(const colorHex in colors) {
        const colorVal = Number(colorHex);

        this.colorMap[colorVal] = colors[colorHex];
    }
}

SchemaType.prototype.load = function(config, DEBUG_NAME) {
    const {
        colors = {},
        hud = null,
        text = null
    } = config;

    for(const colorHex in colors) {
        const colorVal = Number(colorHex);

        this.colorMap[colorVal] = colors[colorHex];
    }

    if(hud !== null) {
        this.hudColor = getRGBAStringByArray(hud);
    }

    if(text !== null) {
        this.textColor = getRGBAStringByArray(text);
    }
}