import { getRGBAString } from "../../graphics/colorHelper.js";
import { SHAPE } from "../../math/constants.js";
import { DrawHelper } from "../../util/drawHelper.js";
import { UICollider } from "../uiCollider.js";
import { UIElement } from "../uiElement.js";

export const Button = function(DEBUG_NAME) {
    UIElement.call(this, DEBUG_NAME);

    this.shape = SHAPE.RECTANGLE;
    this.collider = new UICollider();
    this.drawFlags = Button.DRAW_FLAG.OUTLINE;
    this.outlineSize = 1;
    this.outlineColor = getRGBAString(255, 255, 255, 255);
    this.backgroundColor = getRGBAString(0, 0, 0, 0);
    this.highlightColor = getRGBAString(200, 200, 200, 64);

    this.collider.events.on(UICollider.EVENT.FIRST_COLLISION, (event) => this.drawFlags |= Button.DRAW_FLAG.HIGHLIGHT, { permanent: true });
    this.collider.events.on(UICollider.EVENT.LAST_COLLISION, (event) => this.drawFlags &= ~Button.DRAW_FLAG.HIGHLIGHT, { permanent: true });
}

Button.DRAW_FLAG = {
    NONE: 0,
    BACKGROUND: 1 << 0,
    HIGHLIGHT: 1 << 1,
    OUTLINE: 1 << 2
};

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
    DrawHelper.drawShape(display, this.shape, "#ff00ff", localX, localY, this.width, this.height);
}

Button.prototype.drawBackground = function(display, localX, localY) {
    if((this.drawFlags & Button.DRAW_FLAG.BACKGROUND) !== 0) {
        DrawHelper.drawShape(display, this.shape, this.backgroundColor, localX, localY, this.width, this.height);
    }
}

Button.prototype.drawHighlight = function(display, localX, localY) {
    if((this.drawFlags & Button.DRAW_FLAG.HIGHLIGHT) !== 0) {
        DrawHelper.drawShape(display, this.shape, this.highlightColor, localX, localY, this.width, this.height);
    }
}

Button.prototype.drawOutline = function(display, localX, localY) {
    if((this.drawFlags & Button.DRAW_FLAG.OUTLINE) !== 0) {
        DrawHelper.strokeShape(display, this.shape, this.outlineColor, this.outlineSize, localX, localY, this.width, this.height);
    }
}

Button.prototype.onDraw = function(display, localX, localY) {
    this.drawBackground(display, localX, localY);
    this.drawHighlight(display, localX, localY);
    this.drawOutline(display, localX, localY);
}