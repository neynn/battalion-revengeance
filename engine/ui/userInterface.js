import { Collider } from "../graphics/collider.js";
import { UIElement } from "./uiElement.js";

export const UserInterface = function(id) {
    this.id = id;
    this.roots = [];
    this.nameMap = new Map();
    this.elements = new Map();
    this.state = UserInterface.STATE.VISIBLE;
    this.previousCollisions = [];
    this.currentCollisions = [];
}

UserInterface.EMPTY_ELEMENT = new UIElement("EMPTY");

UserInterface.STATE = {
    HIDDEN: 0,
    VISIBLE: 1
};

UserInterface.prototype.hide = function() {
    this.state = UserInterface.STATE.HIDDEN;
}

UserInterface.prototype.show = function() {
    this.state = UserInterface.STATE.VISIBLE;
}

UserInterface.prototype.getID = function() {
    return this.id;
}

UserInterface.prototype.clear = function() {
    this.elements.forEach(element => element.closeGraph());
    this.elements.clear();
    this.nameMap.clear();
    this.roots.length = 0;
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
        element.closeGraph();

        this.elements.delete(elementID);

        for(let i = 0; i < this.roots.length; i++) {
            if(this.roots[i] === element) {
                this.roots.splice(i, 1);
                break;
            }
        }
    }
}

UserInterface.prototype.debug = function(display) {
    for(let i = 0; i < this.roots.length; i++) {
        this.roots[i].debug(display, 0, 0);
    }
}

UserInterface.prototype.draw = function(display, realTime, deltaTime) {
    if(this.state === UserInterface.STATE.HIDDEN) {
        return;
    }

    for(let i = 0; i < this.roots.length; i++) {
        const element = this.roots[i];

        element.update(realTime, deltaTime);
        element.draw(display, 0, 0);
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

UserInterface.prototype.handleClick = function(event) {
    for(let i = 0; i < this.currentCollisions.length; i++) {
        this.currentCollisions[i].onClick(event);
    }

    return this.currentCollisions.length;
}

UserInterface.prototype.updateCollisions = function(mouseX, mouseY, mouseRange) {
    [this.currentCollisions, this.previousCollisions] = [this.previousCollisions, this.currentCollisions];
    this.currentCollisions.length = 0;

    if(this.state === UserInterface.STATE.VISIBLE) {
        for(let i = 0; i < this.roots.length; i++) {
            this.roots[i].mGetCollisions(this.currentCollisions, mouseX, mouseY, mouseRange);

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

            return true;
        }
    }

    return false;
}

UserInterface.prototype.refreshRoots = function() {
    this.roots.length = 0;

    for(const [elementID, element] of this.elements) {
        if(!element.hasParent()) {
            this.roots.push(element);
        }
    }
}

UserInterface.prototype.clearRoots = function() {
    this.roots.length = 0;
}

UserInterface.prototype.updateRootAnchors = function(width, height) {
    for(let i = 0; i < this.roots.length; i++) {
        this.roots[i].updateAnchor(width, height);
    }
}