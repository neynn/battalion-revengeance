import { Widget } from "./widget.js";

export const ButtonWidget = function() {
    Widget.call(this);

    this.shape = 0;
    this.deltaX = 0;
    this.deltaY = 0;
}
