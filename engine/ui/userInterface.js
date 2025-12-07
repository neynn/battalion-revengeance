import { Collider } from "../graphics/collider.js";
import { Graph } from "../graphics/graph.js";
import { UIElement } from "./uiElement.js";

export const UserInterface = function() {
    Graph.call(this);

    this.nameMap = new Map();
    this.elements = new Map();
    this.previousCollisions = [];
    this.currentCollisions = [];
}

UserInterface.EMPTY_ELEMENT = new UIElement("EMPTY");

UserInterface.prototype = Object.create(Graph.prototype);
UserInterface.prototype.constructor = UserInterface;

UserInterface.prototype.onWindowResize = function(width, height) {
    for(let i = 0; i < this.children.length; i++) {
        this.children[i].onWindowResize(width, height);
    }
}

UserInterface.prototype.onClick = function(event) {
    for(let i = 0; i < this.currentCollisions.length; i++) {
        this.currentCollisions[i].onClick(event);
    }

    return this.currentCollisions.length;
}

UserInterface.prototype.clear = function() {
    this.elements.forEach(element => element.close());
    this.elements.clear();
    this.nameMap.clear();
    this.close();
}

UserInterface.prototype.destroyNamedElement = function(name) {
    const elementID = this.nameMap.get(name);

    if(elementID !== undefined) {
        this.destroyElement(elementID);

        this.nameMap.delete(name);
    }
}

UserInterface.prototype.destroyElement = function(elementID) {
    const element = this.elements.get(elementID);

    if(element) {        
        element.close();

        this.elements.delete(elementID);
    }
}

UserInterface.prototype.getElement = function(name) {
    const elementID = this.nameMap.get(name);
    const element = this.elements.get(elementID);

    if(!element) {
        return UserInterface.EMPTY_ELEMENT;
    }

    return element;
}

UserInterface.prototype.updateCollisions = function(mouseX, mouseY, mouseRange) {
    [this.currentCollisions, this.previousCollisions] = [this.previousCollisions, this.currentCollisions];
    this.currentCollisions.length = 0;

    if(this.isVisible()) {
        for(let i = 0; i < this.children.length; i++) {
            this.children[i].mGetCollisions(this.currentCollisions, mouseX, mouseY, mouseRange);

            if(this.currentCollisions.length > 0) {
                break;
            }
        }
    }

    for(let i = 0; i < this.currentCollisions.length; i++) {
        const element = this.currentCollisions[i];
        const { collider } = element;

        collider.onCollisionUpdate(Collider.COLLISION_STATE.COLLIDED, mouseX, mouseY, mouseRange);
    }

    for(let i = 0; i < this.previousCollisions.length; i++) {
        const element = this.previousCollisions[i];
        const { collider } = element;

        if(!this.currentCollisions.includes(element)) {
            collider.onCollisionUpdate(Collider.COLLISION_STATE.NOT_COLLIDED, mouseX, mouseY, mouseRange);
        }
    }

    return this.currentCollisions.length;
}

UserInterface.prototype.addElement = function(element) {
    const elementID = element.getID();

    if(!this.elements.has(elementID)) {
        this.elements.set(elementID, element);
    }
}

UserInterface.prototype.addNamedElement = function(element, name) {
    if(!this.nameMap.has(name)) {
        const elementID = element.getID();

        if(!this.elements.has(elementID)) {
            this.nameMap.set(name, elementID);
            this.elements.set(elementID, element);
        }
    }
}

UserInterface.prototype.refreshRoots = function() {
    this.close();

    for(const [elementID, element] of this.elements) {
        if(!element.hasParent()) {
            this.addChild(element);
        }
    }
}