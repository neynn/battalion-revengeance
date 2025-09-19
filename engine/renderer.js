import { Display } from "./camera/display.js";
import { EffectManager } from "./effects/effectManager.js";
import { CameraContext } from "./camera/cameraContext.js";
import { Camera2D } from "./camera/camera2D.js";
import { ContextHelper } from "./camera/contextHelper.js";

export const Renderer = function(windowWidth, windowHeight) {
    this.contexts = [];
    this.windowWidth = windowWidth;
    this.windowHeight = windowHeight;

    this.display = new Display();
    this.display.init(this.windowWidth, this.windowHeight, Display.TYPE.DISPLAY);

    this.effectManager = new EffectManager();
}

Renderer.DEBUG = {
    CONTEXT: false,
    INTERFACE: false,
    SPRITES: false,
    MAP: false
};

Renderer.FPS_COLOR = {
    BAD: "#ff0000",
    GOOD: "#00ff00"
};

Renderer.prototype.exit = function() {
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

Renderer.prototype.createContext = function(contextID, camera) {
    if(this.hasContext(contextID)) {
        return this.getContext(contextID);
    }

    const context = new CameraContext(contextID, camera);

    context.setSize(this.windowWidth, this.windowHeight);

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
    const { timer, uiManager } = gameContext; 
    const deltaTime = timer.getDeltaTime();
    const realTime = timer.getRealTime();

    this.display.clear();
    this.effectManager.update(this.display, deltaTime);

    for(let i = 0; i < this.contexts.length; i++) {
        this.display.save();
        this.contexts[i].update(gameContext, this.display);
        this.display.reset();
    }

    if(Renderer.DEBUG.CONTEXT) {
        for(let i = 0; i < this.contexts.length; i++) {
            this.contexts[i].debug(this.display.context);
        }
    }

    this.display.save();

    uiManager.draw(this.display, realTime, deltaTime);

    this.display.reset();

    if(Renderer.DEBUG.INTERFACE) {
        uiManager.debug(this.display);
    }

    this.drawInfo(gameContext);
}

Renderer.prototype.drawInfo = function(gameContext) {
    const { context } = this.display;
    const { timer } = gameContext;
    const { x, y } = ContextHelper.getMouseTile(gameContext);
    const fps = Math.round(timer.getFPS());

    if(fps >= 60) {
        context.fillStyle = Renderer.FPS_COLOR.GOOD;
    } else {
        context.fillStyle = Renderer.FPS_COLOR.BAD;
    }
    
    const TEXT_SIZE = 10;
    const WINDOW_Y = 0;
    const DEBUG_Y = TEXT_SIZE * 5;

    context.globalAlpha = 1;
    context.font = `${TEXT_SIZE}px Arial`;

    context.fillText(`FPS: ${fps}`, 0, WINDOW_Y + TEXT_SIZE);
    context.fillText(`WindowX: ${this.windowWidth}, WindowY: ${this.windowHeight}`, 0, WINDOW_Y + TEXT_SIZE * 2);
    context.fillText(`MouseX: ${x}, MouseY: ${y}`, 0, WINDOW_Y + TEXT_SIZE * 3);

    context.fillText(`DEBUG-MAP: ${Renderer.DEBUG.MAP}`, 0, DEBUG_Y);
    context.fillText(`DEBUG-CONTEXT: ${Renderer.DEBUG.CONTEXT}`, 0, DEBUG_Y + TEXT_SIZE);
    context.fillText(`DEBUG-INTERFACE: ${Renderer.DEBUG.INTERFACE}`, 0, DEBUG_Y + TEXT_SIZE * 2);
    context.fillText(`DEBUG-SPRITES: ${Renderer.DEBUG.SPRITES}`, 0, DEBUG_Y + TEXT_SIZE * 3);
}

Renderer.prototype.onWindowResize = function(width, height) {
    this.windowWidth = width;
    this.windowHeight = height;
    this.display.onWindowResize(width, height);

    for(let i = 0; i < this.contexts.length; i++) {
        this.contexts[i].onWindowResize(this.display.width, this.display.height);
    }
}

Renderer.prototype.onMapSizeUpdate = function(mapWidth, mapHeight) {
    for(let i = 0; i < this.contexts.length; i++) {
        const context = this.contexts[i];
        const camera = context.getCamera();

        if(camera instanceof Camera2D) {
            camera.setMapSize(mapWidth, mapHeight);
        }

        context.refresh();
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