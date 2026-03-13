import { Widget } from "./widget.js";

export const TextWidget = function() {
    Widget.call(this);

    this.text = "";
    this.deltaX = 0;
    this.deltaY = 0;
}