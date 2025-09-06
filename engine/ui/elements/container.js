import { getRGBAString } from "../../graphics/helpers.js";
import { SHAPE } from "../../math/constants.js";
import { UICollider } from "../uiCollider.js";
import { UIElement } from "../uiElement.js";

export const Container = function(DEBUG_NAME) {
    UIElement.call(this, DEBUG_NAME);

    this.collider = new UICollider();
    this.drawBackground = false;
    this.drawOutline = true;
    this.backgroundColor = getRGBAString(255, 255, 255, 255);
    this.outlineColor = getRGBAString(255, 255, 255, 255);
    this.outlineSize = 1;
} 

Container.prototype = Object.create(UIElement.prototype);
Container.prototype.constructor = Container;

Container.prototype.onDraw = function(display, localX, localY) {
    const { context } = display;

    if(this.drawBackground) {
        context.fillStyle = this.backgroundColor;
        display.drawShape(SHAPE.RECTANGLE, localX, localY, this.width, this.height);
    }

    if(this.drawOutline) {
        context.strokeStyle = this.outlineColor;
        context.lineWidth = this.outlineSize;
        display.strokeShape(SHAPE.RECTANGLE, localX, localY, this.width, this.height);
    }
}

Container.prototype.onDebug = function(display, localX, localY) {
    const { context } = display;
    
    context.globalAlpha = 0.2;
    context.fillStyle = "#0000ff";
    context.fillRect(localX, localY, this.width, this.height);
}