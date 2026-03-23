import { isCircleCicleIntersect, isRectangleRectangleIntersect } from "../math/math.js";

export const Graph = function(DEBUG_NAME = "") {
    this.DEBUG_NAME = DEBUG_NAME;
    this.id = Graph.NEXT_ID++;
    this.positionX = 0;
    this.positionY = 0;
    this.width = 0;
    this.height = 0;
    this.opacity = 1;
    this.collider = Graph.COLLIDER.NONE;
    this.children = [];
    this.parent = null;

    this._child = 0;
    this._screenX = 0;
    this._screenY = 0;
    this._flags = Graph.FLAG.IS_VISIBLE;
}

Graph.COLLIDER = {
    NONE: 0,
    RECTANGLE: 1,
    CIRCLE: 2
};

Graph.FLAG = {
    NONE: 0,
    IS_VISIBLE: 1 << 0,
    BLEND_ALPHA: 1 << 1
};

Graph.NEXT_ID = 100000;
Graph.INVALID_ID = -1;

Graph.prototype.onCollisionBegin = function() {}
Graph.prototype.onCollisionEnd = function() {}
Graph.prototype.onCollision = function() {}

Graph.prototype.onWindowResize = function(width, height) {}
Graph.prototype.onDraw = function(display, screenX, screenY) {}
Graph.prototype.onDebug = function(display, screenX, screenY) {}
Graph.prototype.onUpdate = function(timestamp, deltaTime) {}

Graph.prototype.clear = function() {
    this._child = 0;
    this._screenX = 0;
    this._screenY = 0;
}

Graph.prototype.isVisible = function() {
    return (this._flags & Graph.FLAG.IS_VISIBLE) !== 0;
}

Graph.prototype.find = function(childID) {
    let element = this;

    while(element) {
        if(element.id === childID) {
            return element;
        }   

        while(element) {
            if(element._child >= element.children.length) {
                element._child = 0;
                element = element.parent;
            } else {
                element = element.children[element._child++];
                break;
            }
        }
    }

    return null;
}

Graph.prototype.traverse = function(onCall) {    
    const stack = [this];
    let order = 0;

    while(stack.length !== 0) {
        const graph = stack.pop();
        const { children } = graph;

        for(let i = children.length - 1; i >= 0; i--) {
            stack.push(children[i]);
        }

        onCall(graph, order);
        order++;
    }
}

Graph.prototype.update = function(timestamp, deltaTime) {
    let element = this;

    while(element) {        
        element.onUpdate(timestamp, deltaTime);

        while(element) {
            if(element._child >= element.children.length) {
                element._child = 0;
                element = element.parent;
            } else {
                element = element.children[element._child++];
                break;
            }
        }
    }
}

Graph.prototype.debug = function(display, screenX, screenY) {
    this._screenX = this.positionX - screenX;
    this._screenY = this.positionY - screenY;
    let element = this;

    while(element) {
        const { _screenX, _screenY } = element;
        
        element.onDebug(display, _screenX, _screenY);

        while(element) {
            if(element._child >= element.children.length) {
                element._child = 0;
                element = element.parent;
            } else {
                element = element.children[element._child++];
                element._screenX = element.parent._screenX + element.positionX;
                element._screenY = element.parent._screenY + element.positionY;
                break;
            }
        }
    }
}

Graph.prototype.draw = function(display, screenX, screenY) {
    if(!(this._flags & Graph.FLAG.IS_VISIBLE)) {
        return;
    }

    this._screenX = this.positionX - screenX;
    this._screenY = this.positionY - screenY;
    let element = this;

    while(element) {
        const { _screenX, _screenY, opacity } = element;
        let next = element;

        display.setAlpha(opacity);
        element.onDraw(display, _screenX, _screenY);

        while(next) {
            if(element._child >= element.children.length) {
                element._child = 0;
                element = element.parent;
                next = element;
            } else {
                next = element.children[element._child++];

                if(next._flags & Graph.FLAG.IS_VISIBLE) {
                    next._screenX = element._screenX + next.positionX;
                    next._screenY = element._screenY + next.positionY;
                    element = next;
                    break;
                }
            }
        }
    }
}

Graph.prototype.getGraph = function() {
    const stack = [this];
    let index = 0;

    while(index < stack.length) {
        const { children } = stack[index];

        for(const child of children) {
            stack.push(child);
        }

        index++;
    }

    return stack;
}

Graph.prototype.getID = function() {
    return this.id;
}

Graph.prototype.updatePosition = function(deltaX, deltaY) {
    this.positionX += deltaX;
    this.positionY += deltaY;
}

Graph.prototype.setSize = function(width, height) {
    this.width = width;
    this.height = height;
} 

Graph.prototype.setPosition = function(positionX, positionY) {
    this.positionX = positionX;
    this.positionY = positionY;
}

Graph.prototype.hide = function() {
    this._flags &= ~Graph.FLAG.IS_VISIBLE;
}

Graph.prototype.show = function() {
    this._flags |= Graph.FLAG.IS_VISIBLE;
}

Graph.prototype.setOpacity = function(opacity) {
    if(typeof opacity === "number") {
        if(opacity > 1) {
            this.opacity = 1;
        } else if(opacity < 0) {
            this.opacity = 0;
        } else {
            this.opacity = opacity;
        }
    }
}

Graph.prototype.getOpacity = function() {
    return this.opacity;
}

Graph.prototype.hasParent = function() {
    return this.parent !== null;
}

Graph.prototype.getChild = function(id) {
    for(let i = 0; i < this.children.length; i++) {
        const child = this.children[i];

        if(child.id === id) {
            return child;
        }
    }

    return null;
}

Graph.prototype.removeChild = function(childID) {
    for(let i = 0; i < this.children.length; i++) {
        const child = this.children[i];

        if(child.id === childID) {
            this.children.splice(i, 1);
            return;
        }
    }
}

Graph.prototype.close = function() {
    if(this.parent !== null) {
        this.parent.removeChild(this.id);
        this.parent = null;
    }

    for(let i = 0; i < this.children.length; i++) {
        this.children[i].parent = null;
    }

    this.children.length = 0;
}

Graph.prototype.addChild = function(child) {
    const childID = child.getID();
    const graph = this.find(childID);

    if(graph) {
        return;
    }

    child.setParent(this);

    this.children.push(child);
}

Graph.prototype.setParent = function(parent) {
    if(this.parent !== null) {
        this.parent.removeChild(this.id);
    }

    this.parent = parent;
}

Graph.prototype.getCollision = function(mouseX, mouseY, mouseRange) {
    let element = this;
    let collision = null;

    if(this.collider === Graph.COLLIDER.NONE || (this._flags & Graph.FLAG.IS_VISIBLE) === 0) {
        return collision;
    }

    this._screenX = this.positionX;
    this._screenY = this.positionY;

    while(element) {
        const { _screenX, _screenY, width, height, collider } = element;
        let isColliding = false;
        let next = element;

        switch(collider) {
            case Graph.COLLIDER.RECTANGLE: {
                isColliding = isRectangleRectangleIntersect(_screenX, _screenY, width, height, mouseX, mouseY, mouseRange, mouseRange);
                break;
            }
            case Graph.COLLIDER.CIRCLE: {
                isColliding = isCircleCicleIntersect(_screenX, _screenY, width, mouseX, mouseY, mouseRange);
                break;
            }
        }

        if(isColliding) {
            collision = element;

            //Disallows checking siblings as there can only be one collision branch.
            if(element.parent) {
                element.parent._child = element.parent.children.length;
            }
        } else {
            element = element.parent;
        }

        while(next) {
            if(element._child >= element.children.length) {
                element._child = 0;
                element = element.parent;
                next = element;
            } else {
                next = element.children[element._child++];

                if(next.collider !== Graph.COLLIDER.NONE && (next._flags & Graph.FLAG.IS_VISIBLE)) {
                    next._screenX = element._screenX + next.positionX;
                    next._screenY = element._screenY + next.positionY;
                    element = next;
                    break;
                }
            }
        }
    }

    return collision;
}