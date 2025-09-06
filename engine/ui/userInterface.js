import { SwapSet } from "../util/swapSet.js";
import { TextElement } from "./elements/textElement.js";
import { UICollider } from "./uiCollider.js";

export const UserInterface = function(id) {
    this.id = id;
    this.roots = [];
    this.nameMap = new Map();
    this.elements = new Map();
    this.state = UserInterface.STATE.VISIBLE;
    this.collisions = new SwapSet();
}

UserInterface.STATE = {
    HIDDEN: 0,
    VISIBLE: 1,
    VISIBLE_NO_INTERACT: 2
};

UserInterface.prototype.getID = function() {
    return this.id;
}

UserInterface.prototype.clear = function() {
    this.elements.forEach(element => element.closeGraph());
    this.elements.clear();
    this.nameMap.clear();
    this.roots.length = 0;
}

UserInterface.prototype.isAnyColliding = function() {
    return this.collisions.current.size > 0;
}

UserInterface.prototype.handleClick = function(mouseX, mouseY, mouseRange) {
    for(const elementID of this.collisions.current) {
        const element = this.elements.get(elementID);

        element.collider.click(mouseX, mouseY, mouseRange);
    }
}

UserInterface.prototype.destroyElement = function(name) {
    const element = this.getElement(name);

    if(element) {
        const elementID = element.getID();
        
        element.closeGraph();

        this.elements.delete(elementID);
        this.nameMap.delete(name);

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
        return null;
    }

    return element;
}

UserInterface.prototype.getCollisions = function(mouseX, mouseY, mouseRange) {
    if(this.state === UserInterface.STATE.VISIBLE) {
        for(let i = 0; i < this.roots.length; i++) {
            const element = this.roots[i];
            const collisions = element.getCollisions(mouseX, mouseY, mouseRange);

            if(collisions.length > 0) {
                return collisions;
            }
        }
    }

    return [];
}

UserInterface.prototype.updateCollisions = function(mouseX, mouseY, mouseRange) {
    const collisions = this.getCollisions(mouseX, mouseY, mouseRange);

    this.collisions.swap();

    for(let i = 0; i < collisions.length; i++) {
        const element = collisions[i];
        const elementID = element.getID();

        this.collisions.addCurrent(elementID);

        element.collider.onCollisionUpdate(UICollider.STATE.COLLIDED, mouseX, mouseY, mouseRange);
    }

    for(const elementID of this.collisions.previous) {
        const isCurrent = this.collisions.isCurrent(elementID);

        if(!isCurrent) {
            const element = this.elements.get(elementID);

            element.collider.onCollisionUpdate(UICollider.STATE.NOT_COLLIDED, mouseX, mouseY, mouseRange);
        }
    }
}

UserInterface.prototype.addElement = function(element) {
    const elementID = element.getID();

    if(!this.elements.has(elementID)) {
        this.elements.set(elementID, element);

        return true;
    }

    return false;
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

UserInterface.prototype.addClick = function(elementID, onClick) {
    const element = this.getElement(elementID);

    if(element && element.collider) {
        element.collider.events.on(UICollider.EVENT.CLICKED, onClick, { id: this.id });
    }
}

UserInterface.prototype.removeClick = function(elementID) {
    const element = this.getElement(elementID);

    if(element && element.collider) {
        element.collider.events.unsubscribeAll(UICollider.EVENT.CLICKED, this.id);
    }
}

UserInterface.prototype.setText = function(textID, message) {
    const text = this.getElement(textID);

    if(text && (text instanceof TextElement)) {
        text.setText(message);
    }
}