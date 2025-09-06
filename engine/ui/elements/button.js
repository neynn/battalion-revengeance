import { getRGBAString } from "../../graphics/helpers.js";
import { SHAPE } from "../../math/constants.js";
import { UICollider } from "../uiCollider.js";
import { UIElement } from "../uiElement.js";

export const Button = function(DEBUG_NAME) {
    UIElement.call(this, DEBUG_NAME);

    this.shape = SHAPE.RECTANGLE;
    this.collider = new UICollider();
    this.drawBackground = false;
    this.drawHighlight = false;
    this.drawOutline = true;
    this.backgroundColor = getRGBAString(0, 0, 0, 0);
    this.highlightColor = getRGBAString(200, 200, 200, 64);
    this.outlineColor = getRGBAString(255, 255, 255, 255);
    this.outlineSize = 1;

    this.collider.events.on(UICollider.EVENT.FIRST_COLLISION, (mouseX, mouseY, mouseRange) => this.drawHighlight = true, { permanent: true });
    this.collider.events.on(UICollider.EVENT.LAST_COLLISION, (mouseX, mouseY, mouseRange) => this.drawHighlight = false, { permanent: true });
}

Button.prototype = Object.create(UIElement.prototype);
Button.prototype.constructor = Button;

Button.prototype.setShape = function(shape) {
    switch(shape) {
        case SHAPE.RECTANGLE: {
            this.shape = SHAPE.RECTANGLE;
            this.collider.setShape(SHAPE.RECTANGLE);
            break;
        }
        case SHAPE.CIRCLE: {
            this.shape = SHAPE.CIRCLE;
            this.collider.setShape(SHAPE.CIRCLE);
            break;
        }
    }
} 

Button.prototype.onDebug = function(display, localX, localY) {
    const { context } = display;
    
    context.globalAlpha = 0.2;
    context.fillStyle = "#ff00ff";
    display.drawShape(this.shape, localX, localY, this.width, this.height);
}

Button.prototype.onDrawBackground = function(display, localX, localY) {
    if(this.drawBackground) {
        const { context } = display;

        context.fillStyle = this.backgroundColor;
        display.drawShape(this.shape, localX, localY, this.width, this.height);
    }
}

Button.prototype.onDrawHighlight = function(display, localX, localY) {
    if(this.drawHighlight) {
        const { context } = display;

        context.fillStyle = this.highlightColor;
        display.drawShape(this.shape, localX, localY, this.width, this.height);
    }
}

Button.prototype.onDrawOutline = function(display, localX, localY) {
    if(this.drawOutline) {
        const { context } = display;

        context.strokeStyle = this.outlineColor;
        context.lineWidth = this.outlineSize;
        display.strokeShape(this.shape, localX, localY, this.width, this.height);
    }
}

Button.prototype.onDraw = function(display, localX, localY) {
    this.onDrawBackground(display, localX, localY);
    this.onDrawHighlight(display, localX, localY);
    this.onDrawOutline(display, localX, localY);
}