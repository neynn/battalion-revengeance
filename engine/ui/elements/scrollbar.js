import { UIElement } from "../uiElement.js";

export const Scrollbar = function(DEBUG_NAME) {
    UIElement.call(this, DEBUG_NAME);
}

Scrollbar.TYPE = {
    HORIZONTAL: 0,
    VERTICAL: 1
};

Scrollbar.prototype = Object.create(UIElement.prototype);
Scrollbar.prototype.constructor = Scrollbar;