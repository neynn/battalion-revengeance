import { Cursor } from "../client/cursor/cursor.js";
import { MouseButton } from "../client/cursor/mouseButton.js";
import { Graph } from "../graphics/graph.js";
import { UIElement } from "./uiElement.js";

export const IM_FLAG = {
    NONE: 0,
    HOT: 1 << 0,
    ACTIVE: 1 << 1,
    CLICKED: 1 << 2
};

export const UIContext = function() {
    Graph.call(this);

    this.previousHot = null;
    this.collisions = 0;
    this.names = new Map();
    this.elements = new Map();
    this.clickCallbacks = new Map();

    this.hotWidget = -1;
    this.activeWidget = -1;
    this.isImmediate = false;
}

UIContext.EMPTY_ELEMENT = new UIElement("EMPTY");

UIContext.prototype = Object.create(Graph.prototype);
UIContext.prototype.constructor = UIContext;

UIContext.prototype.onImmediate = function(gameContext, display) {}

UIContext.prototype.doButton = function(gameContext, widgetID, x, y, w, h) {
    const { client } = gameContext;
    const { cursor } = client;
    const lmbFlags = cursor.getFlags(Cursor.BUTTON.LEFT);
    const isHovered = cursor.collidesRect(x, y, w, h);
    let flags = IM_FLAG.NONE;

    if(isHovered && this.hotWidget === -1) {
        flags |= IM_FLAG.HOT;

        this.hotWidget = widgetID;
    }

    if((lmbFlags & MouseButton.FLAG.DOWN) && this.hotWidget === widgetID) {
        this.activeWidget = widgetID;
    }

    if(this.activeWidget === widgetID) {
        flags |= IM_FLAG.ACTIVE;

        if(lmbFlags & MouseButton.FLAG.UP) {
            if(this.hotWidget === widgetID) {
                flags |= IM_FLAG.CLICKED;
            }
        
            flags &= ~IM_FLAG.ACTIVE;

            this.activeWidget = -1;
        }
    }

    return flags;
}

UIContext.prototype.getElementID = function(name) {
    const elementID = this.names.get(name);

    if(elementID === undefined) {
        return Graph.INVALID_ID;
    }

    return elementID;
}

UIContext.prototype.addClick = function(elementID, onClick) {
    if(!this.clickCallbacks.has(elementID)) {
        this.clickCallbacks.set(elementID, onClick);
    } else {
        console.warn("Click has already been registered!");
    }
}

UIContext.prototype.addClickByName = function(name, onClick) {
    const elementID = this.getElementID(name);

    if(elementID !== Graph.INVALID_ID) {
        this.addClick(elementID, onClick);
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
    this.names.clear();
    this.clickCallbacks.clear();
    this.close();
}

UIContext.prototype.destroyElement = function(elementID) {
    const element = this.elements.get(elementID);

    if(element) {        
        element.close();

        this.elements.delete(elementID);
    }
}

UIContext.prototype.getElement = function(name) {
    const elementID = this.getElementID(name);
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

UIContext.prototype.registerName = function(name, element) {
    if(!this.names.has(name)) {
        this.names.set(name, element.getID());
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