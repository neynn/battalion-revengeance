import { Graph } from "../graphics/graph.js";
import { UIElement } from "./uiElement.js";

export const UIContext = function() {
    Graph.call(this);

    this.previousHot = null;
    this.collisions = 0;
    this.nameMap = new Map();
    this.elements = new Map();
    this.isRetained = true;
}

UIContext.EMPTY_ELEMENT = new UIElement("EMPTY");

UIContext.prototype = Object.create(Graph.prototype);
UIContext.prototype.constructor = UIContext;

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