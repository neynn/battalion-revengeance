import { getRGBAString } from "../../graphics/colorHelper.js";
import { Widget } from "./widget.js";

export const ButtonWidget = function() {
    Widget.call(this);

    this.shape = 0;
    this.thickness = 1;
    this.background = getRGBAString(0, 0, 0, 0);
    this.highlight = getRGBAString(200, 200, 200, 64);
    this.outline = getRGBAString(255, 255, 255, 255);
    this.flags = ButtonWidget.FLAG.NONE;
}

ButtonWidget.FLAG = {
    NONE: 0,
    DRAW_BACKGROUND: 1 << 0,
    DRAW_HIGHLIGHT: 1 << 1,
    DRAW_OUTLINE: 1 << 2
};
