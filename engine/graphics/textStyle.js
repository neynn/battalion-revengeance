import { getRGBAString, getRGBAStringByArray } from "./helpers.js";

export const TextStyle = function() {
    this.color = getRGBAString(0, 0, 0, 255);
    this.fontSize = TextStyle.DEFAULT.FONT_SIZE;
    this.fontType = TextStyle.DEFAULT.FONT_TYPE;
    this.baseline = TextStyle.TEXT_BASELINE.MIDDLE;
    this.alignment = TextStyle.TEXT_ALIGNMENT.LEFT;
    this.font = null;

    this.updateFont();
}

TextStyle.DEFAULT = {
    FONT_SIZE: 10,
    FONT_TYPE: "sans-serif"
};

TextStyle.TEXT_BASELINE = {
    MIDDLE: "middle"
};

TextStyle.TEXT_ALIGNMENT = {
    RIGHT: "right",
    LEFT: "left",
    MIDDLE: "center"
};

TextStyle.prototype.setAlignment = function(alignment) {
    if(alignment === undefined) {
        return;
    }

    this.alignment = alignment;
}

TextStyle.prototype.setBaseline = function(baseline) {
    if(baseline === undefined) {
        return;
    }

    this.baseline = baseline;
}

TextStyle.prototype.updateFont = function() {
    this.font = `${this.fontSize}px ${this.fontType}`;
}

TextStyle.prototype.setFontType = function(fontType) {
    if(fontType === undefined) {
        return;
    }

    this.fontType = fontType;
    this.updateFont();
}

TextStyle.prototype.setFontSize = function(fontSize) {
    if(fontSize === undefined) {
        return;
    }

    this.fontSize = fontSize;
    this.updateFont();
}

TextStyle.prototype.apply = function(context) {
    context.font = this.font;
    context.fillStyle = this.color;
    context.textAlign = this.alignment;
    context.textBaseline = this.baseline;
}

TextStyle.prototype.setColor = function(r, g, b, a) {
    this.color = getRGBAString(r, g, b, a);
}

TextStyle.prototype.setColorArray = function(color) {
    if(color) {
        this.color = getRGBAStringByArray(color);
    }
}