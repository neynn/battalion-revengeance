export const Graph = function(DEBUG_NAME = "") {
    this.DEBUG_NAME = DEBUG_NAME;
    this.id = Graph.ID.NEXT++;
    this.state = Graph.STATE.VISIBLE;
    this.positionX = 0;
    this.positionY = 0;
    this.opacity = 1;
    this.customID = Graph.ID.INVALID;
    this.parent = null;
    this.children = [];
}

Graph.ID = {
    NEXT: 100000,
    INVALID: -1
};

Graph.STATE = {
    HIDDEN: 0,
    VISIBLE: 1
};

Graph.prototype.onDraw = function(display, localX, localY) {}
Graph.prototype.onDebug = function(display, localX, localY) {}
Graph.prototype.onUpdate = function(display, localX, localY) {}

Graph.prototype.findByID = function(childID) {
    const stack = [this];

    while(stack.length !== 0) {
        const graph = stack.pop();
        const { children, id } = graph;

        if(id === childID) {
            return graph;
        }

        for(let i = children.length - 1; i >= 0; i--) {
            stack.push(children[i]);
        }
    }

    return null;
}

Graph.prototype.drizzle = function(onCall) {
    if(typeof onCall !== "function") {
        return;
    }
    
    const stack = [this];

    while(stack.length !== 0) {
        const graph = stack.pop();
        const { children } = graph;

        for(let i = children.length - 1; i >= 0; i--) {
            stack.push(children[i]);
        }

        onCall(graph);
    }
}

Graph.prototype.update = function(timestamp, deltaTime) {
    const stack = [this];

    while(stack.length !== 0) {
        const graph = stack.pop();
        const { children } = graph;

        for(let i = children.length - 1; i >= 0; i--) {
            stack.push(children[i]);
        }

        graph.onUpdate(timestamp, deltaTime);
    }
}

Graph.prototype.debug = function(display, viewportX, viewportY) {
    const stack = [this];
    const positions = [this.positionX - viewportX, this.positionY - viewportY];

    while(stack.length !== 0) {
        const localY = positions.pop();
        const localX = positions.pop();
        const graph = stack.pop();
        const { children } = graph;

        graph.onDebug(display, localX, localY);

        for(let i = children.length - 1; i >= 0; i--) {
            const child = children[i];
            const { positionX, positionY } = child;

            stack.push(child);
            positions.push(localX + positionX);
            positions.push(localY + positionY);
        }
    }
}

Graph.prototype.draw = function(display, viewportX, viewportY) {
    if(this.state !== Graph.STATE.VISIBLE) {
        return;
    }

    const stack = [this];
    const positions = [this.positionX - viewportX, this.positionY - viewportY];

    while(stack.length !== 0) {
        const localY = positions.pop();
        const localX = positions.pop();
        const graph = stack.pop();
        const { children, opacity } = graph;

        display.setAlpha(opacity);
        graph.onDraw(display, localX, localY);

        for(let i = children.length - 1; i >= 0; i--) {
            const child = children[i];
            const { state, positionX, positionY } = child;

            if(state === Graph.STATE.VISIBLE) {
                stack.push(child);
                positions.push(localX + positionX);
                positions.push(localY + positionY);
            }
        }
    }
}

Graph.prototype.getGraph = function() {
    const stack = [this];
    let index = 0;

    while(index < stack.length) {
        const graph = stack[index];
        const { children } = graph;

        for(let i = 0; i < children.length; i++) {
            stack.push(children[i]);
        }

        index++;
    }

    return stack;
}

Graph.prototype.getID = function() {
    return this.id;
}

Graph.prototype.setPosition = function(positionX, positionY) {
    this.positionX = positionX;
    this.positionY = positionY;
}

Graph.prototype.hide = function() {
    this.state = Graph.STATE.HIDDEN;
}

Graph.prototype.show = function() {
    this.state = Graph.STATE.VISIBLE;
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

Graph.prototype.isReserved = function(customID) {
    for(let i = 0; i < this.children.length; i++) {
        const child = this.children[i];

        if(child.customID === customID) {
            return true;
        }
    }

    return false;
}

Graph.prototype.getChildByID = function(id) {
    for(let i = 0; i < this.children.length; i++) {
        const child = this.children[i];

        if(child.id === id) {
            return child;
        }
    }

    return null;
}

Graph.prototype.getChild = function(customID) {
    for(let i = 0; i < this.children.length; i++) {
        const child = this.children[i];

        if(child.customID === customID) {
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

Graph.prototype.closeGraph = function() {
    if(this.parent !== null) {
        this.parent.removeChild(this.id);
        this.parent = null;
    }

    for(let i = 0; i < this.children.length; i++) {
        this.children[i].parent = null;
    }

    this.children.length = 0;
}

Graph.prototype.addChild = function(child, customID = Graph.ID.INVALID) {
    const childID = child.getID();
    const activeChild = this.findByID(childID);

    if(activeChild) {
        return null;
    }

    const usedID = this.isReserved(customID) ? Graph.ID.INVALID : customID;

    child.setCustomID(usedID);
    child.setParent(this);

    this.children.push(child);

    return usedID;
}

Graph.prototype.setCustomID = function(customID) {
    if(customID !== undefined) {
        this.customID = customID;
    }
}

Graph.prototype.setParent = function(parent) {
    if(this.parent !== null) {
        this.parent.removeChild(this.id);
    }

    this.parent = parent;
}