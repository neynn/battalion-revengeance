import { CameraContext } from "./cameraContext.js";

export const ContextManager = function(windowWidth, windowHeight) {
    this.nextID = 0;
    this.contexts = [];
    this.windowWidth = windowWidth;
    this.windowHeight = windowHeight;
    this.debug = false;
}

ContextManager.prototype.exit = function() {
    this.nextID = 0;
    this.contexts.length = 0;
}

ContextManager.prototype.getContext = function(contextID) {
    for(let i = 0; i < this.contexts.length; i++) {
        const context = this.contexts[i];
        const id = context.getID();

        if(id === contextID) {
            return context;
        }
    }

    return null;
}

ContextManager.prototype.hasContext = function(contextID) {
    for(let i = 0; i < this.contexts.length; i++) {
        const context = this.contexts[i];
        const id = context.getID();

        if(id === contextID) {
            return true;
        }
    }

    return false;
}

ContextManager.prototype.createContext = function() {
    const contextID = this.nextID++;
    const context = new CameraContext(contextID);

    context.onWindowResize(this.windowWidth, this.windowHeight);

    this.contexts.push(context);

    return context;
}

ContextManager.prototype.destroyContext = function(contextID) {
    for(let i = 0; i < this.contexts.length; i++) {
        const context = this.contexts[i];
        const id = context.getID();

        if(id === contextID) {
            this.contexts.splice(i, 1);
            return;
        }
    }
}

ContextManager.prototype.draw = function(gameContext, display) {    
    for(let i = 0; i < this.contexts.length; i++) {
        this.contexts[i].draw(gameContext, display);
    }

    if(this.debug) {
        const context = display.context;

        for(let i = 0; i < this.contexts.length; i++) {
            this.contexts[i].debug(context);
        }
    }
}

ContextManager.prototype.onWindowResize = function(width, height) {
    this.windowWidth = width;
    this.windowHeight = height;

    for(let i = 0; i < this.contexts.length; i++) {
        this.contexts[i].onWindowResize(width, height);
    }
}

ContextManager.prototype.getCollidedContext = function(mouseX, mouseY, mouseRange) {
    for(let i = this.contexts.length - 1; i >= 0; i--) {
        const context = this.contexts[i];
        const isColliding = context.isColliding(mouseX, mouseY, mouseRange);

        if(isColliding) {
            return context;
        }
    }

    return null;
}

ContextManager.prototype.onDragUpdate = function(buttonID, deltaX, deltaY) {
    for(let i = this.contexts.length - 1; i >= 0; i--) {
        this.contexts[i].updateDrag(buttonID, deltaX, deltaY);
    }
}

ContextManager.prototype.onDragStart = function(buttonID, buttonX, buttonY, buttonR) {
    for(let i = this.contexts.length - 1; i >= 0; i--) {
        this.contexts[i].startDrag(buttonID, buttonX, buttonY, buttonR);
    }
}

ContextManager.prototype.onDragEnd = function(buttonID) {
    for(let i = this.contexts.length - 1; i >= 0; i--) {
        this.contexts[i].endDrag(buttonID);
    }
}