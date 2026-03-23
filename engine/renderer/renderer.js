import { CameraContext } from "../camera/cameraContext.js";
import { DEBUG } from "../debug.js";

export const Renderer = function(windowWidth, windowHeight) {
    this.nextID = 0;
    this.contexts = [];
    this.windowWidth = windowWidth;
    this.windowHeight = windowHeight;
}

Renderer.prototype.exit = function() {
    this.nextID = 0;
    this.contexts.length = 0;
}

Renderer.prototype.getContext = function(contextID) {
    for(let i = 0; i < this.contexts.length; i++) {
        const context = this.contexts[i];
        const id = context.getID();

        if(id === contextID) {
            return context;
        }
    }

    return null;
}

Renderer.prototype.hasContext = function(contextID) {
    for(let i = 0; i < this.contexts.length; i++) {
        const context = this.contexts[i];
        const id = context.getID();

        if(id === contextID) {
            return true;
        }
    }

    return false;
}

Renderer.prototype.createContext = function(camera) {
    const contextID = this.nextID++;
    const context = new CameraContext(contextID, this, camera);

    context.onWindowResize(this.windowWidth, this.windowHeight);

    this.contexts.push(context);

    return context;
}

Renderer.prototype.destroyContext = function(contextID) {
    for(let i = 0; i < this.contexts.length; i++) {
        const context = this.contexts[i];
        const id = context.getID();

        if(id === contextID) {
            this.contexts.splice(i, 1);
            return;
        }
    }
}

Renderer.prototype.update = function(gameContext) {
    const { timer, uiManager, applicationWindow } = gameContext; 
    const deltaTime = timer.getDeltaTime();
    const display = applicationWindow.display;
    
    display.clear();

    for(let i = 0; i < this.contexts.length; i++) {
        this.contexts[i].draw(gameContext, display);
    }

    if(DEBUG.CONTEXT) {
        const context = display.context;

        for(let i = 0; i < this.contexts.length; i++) {
            this.contexts[i].debug(context);
        }
    }

    display.save();
    uiManager.draw(display);
    display.reset();

    if(DEBUG.UI) {
        uiManager.debug(display);
    }

    if(DEBUG.SHOW_INFO) {
        applicationWindow.drawDebug(gameContext);
    }
}

Renderer.prototype.onWindowResize = function(width, height) {
    this.windowWidth = width;
    this.windowHeight = height;

    for(let i = 0; i < this.contexts.length; i++) {
        this.contexts[i].onWindowResize(width, height);
    }
}

Renderer.prototype.getCollidedContext = function(mouseX, mouseY, mouseRange) {
    for(let i = this.contexts.length - 1; i >= 0; i--) {
        const context = this.contexts[i];
        const isColliding = context.isColliding(mouseX, mouseY, mouseRange);

        if(isColliding) {
            return context;
        }
    }

    return null;
}

Renderer.prototype.onDragUpdate = function(buttonID, deltaX, deltaY) {
    for(let i = this.contexts.length - 1; i >= 0; i--) {
        this.contexts[i].updateDrag(buttonID, deltaX, deltaY);
    }
}

Renderer.prototype.onDragStart = function(buttonID, buttonX, buttonY, buttonR) {
    for(let i = this.contexts.length - 1; i >= 0; i--) {
        this.contexts[i].startDrag(buttonID, buttonX, buttonY, buttonR);
    }
}

Renderer.prototype.onDragEnd = function(buttonID) {
    for(let i = this.contexts.length - 1; i >= 0; i--) {
        this.contexts[i].endDrag(buttonID);
    }
}