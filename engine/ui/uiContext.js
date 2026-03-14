import { Graph } from "../graphics/graph.js";
import { isRectangleRectangleIntersect } from "../math/math.js";
import { drawShape, strokeShape } from "../util/drawHelper.js";
import { UIElement } from "./uiElement.js";
import { ButtonWidget } from "./widgets/button.js";
import { ANCHOR_TABLE_X, ANCHOR_TABLE_Y } from "./widgets/widget.js";

export const UIContext = function() {
    Graph.call(this);

    this.previousHot = null;
    this.collisions = 0;
    this.nameMap = new Map();
    this.elements = new Map();

    //Starts at 2 so the first layout is always 0, 0!
    this.layoutIndex = 2;
    this.layout = new Float32Array(1000);
    this.mode = UIContext.MODE.RETAINED;
}

UIContext.MODE = {
    RETAINED: 0,
    IMMEDIATE: 1,
    HYBRID: 2
};

UIContext.EMPTY_ELEMENT = new UIElement("EMPTY");

UIContext.prototype = Object.create(Graph.prototype);
UIContext.prototype.constructor = UIContext;

UIContext.prototype.updateImmediate = function(gameContext, display) {}

UIContext.prototype.beginLayout = function(gameContext, widget) {
    const { applicationWindow } = gameContext;
    const windowWidth = applicationWindow.width;
    const windowHeight = applicationWindow.height;

    const { width, height, anchor, positionX, positionY } = widget;
    const layoutX = (windowWidth - width) * ANCHOR_TABLE_X[anchor] + positionX;
    const layoutY = (windowHeight - height) * ANCHOR_TABLE_Y[anchor] + positionY;

    this.layout[this.layoutIndex++] = layoutX;
    this.layout[this.layoutIndex++] = layoutY;
}

UIContext.prototype.endLayout = function() {
    this.layoutIndex -= 2;
}

UIContext.prototype.doButton = function(gameContext, display, widget) {
    const { client } = gameContext;
    const { cursor } = client;
    const cursorX = cursor.positionX;
    const cursorY = cursor.positionY;
    const radius = cursor.radius;

    const { deltaX, deltaY, width, height, thickness, outline, background, highlight, shape, flags } = widget;
    const widgetX = this.layout[this.layoutIndex - 2] + deltaX;
    const widgetY = this.layout[this.layoutIndex - 1] + deltaY;
    const isHovered = isRectangleRectangleIntersect(widgetX, widgetY, width, height, cursorX, cursorY, radius, radius);

    if(flags & ButtonWidget.FLAG.DRAW_BACKGROUND) {
        drawShape(display, shape, background, widgetX, widgetY, width, height);
    }

    if(isHovered) {
        if(flags & ButtonWidget.FLAG.DRAW_HIGHLIGHT) {
            drawShape(display, shape, highlight, widgetX, widgetY, width, height);
        }
    } else {

    }

    if(flags & ButtonWidget.FLAG.DRAW_OUTLINE) {
        strokeShape(display, shape, outline, thickness, widgetX, widgetY, width, height);
    }
}

UIContext.prototype.onWindowResize = function(width, height) {
    for(let i = 0; i < this.children.length; i++) {
        this.children[i].onWindowResize(width, height);
    }
}

UIContext.prototype.clear = function() {
    this.elements.forEach(element => element.close());
    this.elements.clear();
    this.nameMap.clear();
    this.close();
}

UIContext.prototype.destroyNamedElement = function(name) {
    const elementID = this.nameMap.get(name);

    if(elementID !== undefined) {
        this.destroyElement(elementID);

        this.nameMap.delete(name);
    }
}

UIContext.prototype.destroyElement = function(elementID) {
    const element = this.elements.get(elementID);

    if(element) {        
        element.close();

        this.elements.delete(elementID);
    }
}

UIContext.prototype.getElement = function(name) {
    const elementID = this.nameMap.get(name);
    const element = this.elements.get(elementID);

    if(!element) {
        return UIContext.EMPTY_ELEMENT;
    }

    return element;
}

UIContext.prototype.updateCollisions = function(mouseX, mouseY, mouseRange) {
    let currentHot = null;

    if(this._flags & Graph.FLAG.IS_VISIBLE) {
        for(let i = 0; i < this.children.length; i++) {
            //This disallows children from accessing each other since UIContext is also a Graph.
            this._child = this.children.length;

            currentHot = this.children[i].getCollision(mouseX, mouseY, mouseRange);

            if(currentHot !== null) {
                break;
            }
        }
    }

    if(currentHot !== this.previousHot) {
        if(this.previousHot !== null) {
            this.previousHot.onCollisionEnd(this.collisions);
        }

        if(currentHot !== null) {
            currentHot.onCollisionBegin(mouseX, mouseY, mouseRange);
            this.collisions = 1;
        }

        this.previousHot = currentHot;
    } else if(this.previousHot !== null) {
        this.previousHot.onCollision(mouseX, mouseY, mouseRange, this.collisions);
        this.collisions++;
    }

    return currentHot !== null;
}

UIContext.prototype.addElement = function(element) {
    const elementID = element.getID();

    if(!this.elements.has(elementID)) {
        this.elements.set(elementID, element);
    }
}

UIContext.prototype.addNamedElement = function(element, name) {
    if(!this.nameMap.has(name)) {
        const elementID = element.getID();

        if(!this.elements.has(elementID)) {
            this.nameMap.set(name, elementID);
            this.elements.set(elementID, element);
        }
    }
}

UIContext.prototype.refreshRoots = function() {
    this.close();

    for(const [elementID, element] of this.elements) {
        if(!element.hasParent()) {
            this.addChild(element);
        }
    }
}