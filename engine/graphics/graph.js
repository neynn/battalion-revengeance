export const Graph = function(DEBUG_NAME = "") {
    this.DEBUG_NAME = DEBUG_NAME;
    this.id = Graph.ID.NEXT++;
    this.positionX = 0;
    this.positionY = 0;
    this.width = 0;
    this.height = 0;
    this.opacity = 1;
    this.name = "";
    this.children = [];
    this.parent = null;
    this.collider = null;
    this._flags = Graph.FLAG.IS_VISIBLE;
}

Graph.FLAG = {
    NONE: 0,
    IS_VISIBLE: 1
};

Graph.ID = {
    NEXT: 100000,
    INVALID: -1
};

Graph.prototype.onWindowResize = function(width, height) {}
Graph.prototype.onDraw = function(display, localX, localY) {}
Graph.prototype.onDebug = function(display, localX, localY) {}
Graph.prototype.onUpdate = function(timestamp, deltaTime) {}
Graph.prototype.onClick = function(event) {}

Graph.prototype.isVisible = function() {
    return (this._flags & Graph.FLAG.IS_VISIBLE) !== 0;
}

Graph.prototype.setClick = function(onClick) {
    if(this.collider !== null) {
        this.onClick = onClick;
    }
}

Graph.prototype.find = function(childID) {
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
    if((this._flags & Graph.FLAG.IS_VISIBLE) === 0) {
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
            const { _flags, positionX, positionY } = child;

            if((_flags & Graph.FLAG.IS_VISIBLE) !== 0) {
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

Graph.prototype.updatePosition = function(deltaX, deltaY) {
    this.positionX += deltaX;
    this.positionY += deltaY;

    if(this.collider) {
        this.collider.updatePosition(deltaX, deltaY);
    }
}

Graph.prototype.setSize = function(width, height) {
    this.width = width;
    this.height = height;

    if(this.collider) {
        this.collider.setSize(width, height);
    }
} 

Graph.prototype.setPosition = function(positionX, positionY) {
    this.positionX = positionX;
    this.positionY = positionY;

    if(this.collider) {
        this.collider.setPosition(positionX, positionY);
    }
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

Graph.prototype.getChildByName = function(name) {
    for(let i = 0; i < this.children.length; i++) {
        const child = this.children[i];

        if(child.name === name) {
            return child;
        }
    }

    return null;
}

Graph.prototype.isNameReserved = function(name) {
    for(let i = 0; i < this.children.length; i++) {
        const child = this.children[i];

        if(child.name === name) {
            return true;
        }
    }

    return false;
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

Graph.prototype.addChild = function(child, name = "") {
    const childID = child.getID();
    const graph = this.find(childID);

    if(graph) {
        return;
    }

    if(name !== "" && !this.isNameReserved(name)) {
        child.name = name;
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

Graph.prototype.mGetCollisions = function(collisions, mouseX, mouseY, mouseRange) {
    if(!this.collider || (this._flags & Graph.FLAG.IS_VISIBLE) === 0) {
        return;
    }

    const stack = [this];
    const positions = [mouseX, mouseY];

    while(stack.length !== 0) {
        const positionY = positions.pop();
        const positionX = positions.pop();
        const graph = stack.pop();
        const isColliding = graph.collider.isColliding(positionX, positionY, mouseRange);

        if(!isColliding) {
            continue;
        }

        const nextX = positionX - graph.positionX;
        const nextY = positionY - graph.positionY;
        const children = graph.children;

        for(let i = 0; i < children.length; i++) {
            const child = children[i];
            const { _flags, collider } = child;

            if((_flags & Graph.FLAG.IS_VISIBLE) !== 0 && collider) {
                stack.push(child);
                positions.push(nextX);
                positions.push(nextY);
            }
        }

        collisions.push(graph);
    }
}