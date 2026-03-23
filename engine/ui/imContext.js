import { Cursor } from "../client/cursor/cursor.js";
import { MouseButton } from "../client/cursor/mouseButton.js";
import { SHAPE } from "../math/constants.js";
import { isCircleCicleIntersect, isRectangleRectangleIntersect } from "../math/math.js";
import { drawShape, strokeShape } from "../util/drawHelper.js";
import { ANCHOR_TABLE_X, ANCHOR_TABLE_Y } from "./constants.js";
import { ButtonWidget } from "./widgets/button.js";

export const IMContext = function() {
    //Snapshot of cursor state.
    this.cursorX = 0;
    this.cursorY = 0;
    this.cursorR = 0;
    this.cursorUp = false;
    this.cursorDown = false;
    this.cursorClick = false;

    this.hotWidget = null;
    this.activeWidget = null;

    //Starts at 2 so the first layout is always 0, 0!
    this.layoutIndex = 2;
    this.layout = new Float32Array(10);
    this.isRetained = false;
}

IMContext.prototype.draw = function(display, screenX, screenY) {}

IMContext.prototype.updateCursor = function(cursor) {
    const { positionX, positionY, radius } = cursor;
    const flags = cursor.getFlags(Cursor.BUTTON.LEFT);

    this.cursorX = positionX;
    this.cursorY = positionY;
    this.cursorR = radius;
    this.cursorUp = (flags & MouseButton.FLAG.UP) !== 0;
    this.cursorDown = (flags & MouseButton.FLAG.DOWN) !== 0;
    this.cursorClick = (flags & MouseButton.FLAG.CLICK) !== 0;
}

IMContext.prototype.beginLayout = function(gameContext, widget) {
    const { applicationWindow } = gameContext;
    const windowWidth = applicationWindow.width;
    const windowHeight = applicationWindow.height;

    const { width, height, anchor, positionX, positionY } = widget;
    const layoutX = (windowWidth - width) * ANCHOR_TABLE_X[anchor] + positionX;
    const layoutY = (windowHeight - height) * ANCHOR_TABLE_Y[anchor] + positionY;

    this.layout[this.layoutIndex++] = layoutX;
    this.layout[this.layoutIndex++] = layoutY;
}

IMContext.prototype.endLayout = function() {
    this.layoutIndex -= 2;
}

IMContext.prototype.doButton = function(display, widgetID, widget, positionX, positionY) {
    const { width, height, thickness, outline, background, highlight, shape, flags } = widget;
    const widgetX = this.layout[this.layoutIndex - 2] + positionX;
    const widgetY = this.layout[this.layoutIndex - 1] + positionY;
    let isHovered = false;
    let isClicked = false;

    switch(shape) {
        case SHAPE.RECTANGLE: {
            isHovered = isRectangleRectangleIntersect(widgetX, widgetY, width, height, this.cursorX, this.cursorY, this.cursorR, this.cursorR);
            break;
        }
        case SHAPE.CIRCLE: {
            isHovered = isCircleCicleIntersect(widgetX, widgetY, width, this.cursorX, this.cursorY, this.cursorR);
            break;
        }
    }

    if(this.activeWidget === widgetID) {
        if(this.cursorUp) {
            if(this.hotWidget === widgetID) {
                isClicked = true;
            }

            this.activeWidget = null;
        }
    } else if(this.hotWidget === widgetID) {
        if(this.cursorDown) {
            this.activeWidget = widgetID;
        }
    }

    if(flags & ButtonWidget.FLAG.DRAW_BACKGROUND) {
        drawShape(display, shape, background, widgetX, widgetY, width, height);
    }

    if(isHovered) {
        this.hotWidget = widgetID;

        if(flags & ButtonWidget.FLAG.DRAW_HIGHLIGHT) {
            drawShape(display, shape, highlight, widgetX, widgetY, width, height);
        }
    }

    if(flags & ButtonWidget.FLAG.DRAW_OUTLINE) {
        strokeShape(display, shape, outline, thickness, widgetX, widgetY, width, height);
    }

    return isClicked;
}