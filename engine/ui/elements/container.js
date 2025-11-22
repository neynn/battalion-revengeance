import { ColorHelper } from "../../graphics/colorHelper.js";
import { SHAPE } from "../../math/constants.js";
import { DrawHelper } from "../../util/drawHelper.js";
import { UICollider } from "../uiCollider.js";
import { UIElement } from "../uiElement.js";

export const Container = function(DEBUG_NAME) {
    UIElement.call(this, DEBUG_NAME);

    this.collider = new UICollider();
    this.drawFlags = Container.DRAW_FLAG.OUTLINE;
    this.outlineSize = 1;
    this.outlineColor = ColorHelper.getRGBAString(255, 255, 255, 255);
    this.backgroundColor = ColorHelper.getRGBAString(255, 255, 255, 255);
} 

Container.DRAW_FLAG = {
    NONE: 0,
    BACKGROUND: 1 << 0,
    OUTLINE: 1 << 1
};

Container.prototype = Object.create(UIElement.prototype);
Container.prototype.constructor = Container;

Container.prototype.onDraw = function(display, localX, localY) {
    if((this.drawFlags & Container.DRAW_FLAG.BACKGROUND) !== 0) {
        DrawHelper.drawShape(display, SHAPE.RECTANGLE, this.backgroundColor, localX, localY, this.width, this.height);
    }

    if((this.drawFlags & Container.DRAW_FLAG.OUTLINE) !== 0) {
        DrawHelper.strokeShape(display, SHAPE.RECTANGLE, this.outlineColor, this.outlineSize, localX, localY, this.width, this.height);
    }
}

Container.prototype.onDebug = function(display, localX, localY) {
    const { context } = display;
    
    context.globalAlpha = 0.2;
    context.fillStyle = "#0000ff";
    context.fillRect(localX, localY, this.width, this.height);
}