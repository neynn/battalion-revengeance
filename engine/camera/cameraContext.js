import { Display } from "./display.js";
import { isRectangleRectangleIntersect } from "../math/math.js";
import { Cursor } from "../client/cursor.js";

export const CameraContext = function(id, renderer, camera, root) {
    this.id = id;
    this.renderer = renderer;
    this.camera = camera;
    this.root = root;
    this.positionX = 0;
    this.positionY = 0;
    this.scaleMode = CameraContext.SCALE_MODE.CUSTOM;
    this.flags = CameraContext.FLAG.NONE;
    this.dragButton = Cursor.BUTTON.NONE;

    this.display = new Display();
    this.display.init(1, 1, Display.TYPE.BUFFER);
}

CameraContext.FLAG = {
    NONE: 0,
    DRAG: 1 << 0,
    USE_BUFFER: 1 << 1,
    AUTO_RESIZE_BUFFER: 1 << 2,
    HIDDEN: 1 << 3,
    AUTO_CENTER: 1 << 4
};

CameraContext.SCALE_MODE = {
    CUSTOM: 0,
    WHOLE: 1,
    FRACTURED: 2
};

CameraContext.prototype.getID = function() {
    return this.id;
}

CameraContext.prototype.getCamera = function() {
    return this.camera;
}

CameraContext.prototype.hide = function() {
    this.flags |= CameraContext.FLAG.HIDDEN;
}

CameraContext.prototype.show = function() {
    this.flags &= ~CameraContext.FLAG.HIDDEN;
}

CameraContext.prototype.setScale = function(scale) {
    if((this.flags & CameraContext.FLAG.USE_BUFFER) !== 0) {
        this.camera.setScale(scale);
        this.refresh();
    }
}

CameraContext.prototype.enableBuffer = function() {
    this.flags |= CameraContext.FLAG.USE_BUFFER;
    this.camera.setViewportSize(this.display.width, this.display.height);
    this.refresh();
}

CameraContext.prototype.disableBuffer = function() {
    this.flags &= ~CameraContext.FLAG.USE_BUFFER;
    this.camera.setScale(1);
    this.camera.setViewportSize(this.renderer.windowWidth, this.renderer.windowHeight);
    this.refresh();
}

CameraContext.prototype.enableBufferResize = function() {
    this.flags |= CameraContext.FLAG.AUTO_RESIZE_BUFFER;
}

CameraContext.prototype.disableBufferResize = function() {
    this.flags &= ~CameraContext.FLAG.AUTO_RESIZE_BUFFER;
}

CameraContext.prototype.enableAutoCenter = function() {
    this.flags |= CameraContext.FLAG.AUTO_CENTER;
    this.centerCameraOnScreen();
}

CameraContext.prototype.disableAutoCenter = function() {
    this.flags &= ~CameraContext.FLAG.AUTO_CENTER;
}

CameraContext.prototype.setDragButton = function(buttonID) {
    this.dragButton = buttonID;
}

CameraContext.prototype.getWorldPosition = function(screenX, screenY) {
    const { scale, viewportX, viewportY } = this.camera;

    return {
        "x": (screenX - this.positionX) / scale + viewportX,
        "y": (screenY - this.positionY) / scale + viewportY
    }
}

CameraContext.prototype.setPosition = function(x, y) {
    this.positionX = Math.floor(x);
    this.positionY = Math.floor(y);
    this.root.setPosition(this.positionX, this.positionY);
}

CameraContext.prototype.centerCameraOnScreen = function() {
    const { scale, worldWidth, worldHeight, sViewportWidth, sViewportHeight } = this.camera;
    const { width, height } = this.display;
    const { windowWidth, windowHeight } = this.renderer;
    const sWorldWidth = worldWidth * scale;
    const sWorldHeight = worldHeight * scale;

    let visibleWidth = 0;
    let visibleHeight = 0;
    let usedWidth = 0;
    let usedHeight = 0;
    let positionX = 0;
    let positionY = 0;

    if(this.flags & CameraContext.FLAG.USE_BUFFER) {
        visibleWidth = width;
        visibleHeight = height;
    } else {
        visibleWidth = sViewportWidth;
        visibleHeight = sViewportHeight;
    }

    if(sWorldWidth < visibleWidth) {
        usedWidth = sWorldWidth;
    } else {
        usedWidth = visibleWidth;
    }

    if(sWorldHeight < visibleHeight) {
        usedHeight = sWorldHeight;
    } else {
        usedHeight = visibleHeight;
    }

    if(windowWidth < usedWidth) {
        positionX = 0;
    } else {
        positionX = (windowWidth - usedWidth) * 0.5;
    }

    if(windowHeight < usedHeight) {
        positionY = 0;
    } else {
        positionY = (windowHeight - usedHeight) * 0.5;
    }

    this.setPosition(positionX, positionY);
}

CameraContext.prototype.startDrag = function(buttonID, buttonX, buttonY, buttonR) {
    if(this.dragButton === buttonID && this.isColliding(buttonX, buttonY, buttonR)) {
        this.flags |= CameraContext.FLAG.DRAG;
    }
}

CameraContext.prototype.updateDrag = function(buttonID, deltaX, deltaY) {
    if(this.dragButton === buttonID && (this.flags & CameraContext.FLAG.DRAG) !== 0) {
        this.camera.dragViewport(deltaX, deltaY);
    }
}

CameraContext.prototype.endDrag = function(buttonID) {
    if(this.dragButton === buttonID) {
        this.flags &= ~CameraContext.FLAG.DRAG;
    }
}

CameraContext.prototype.updateScale = function() {
    if(this.scaleMode === CameraContext.SCALE_MODE.CUSTOM) {
        return;
    }

    let width = this.renderer.windowWidth;
    let height = this.renderer.windowHeight;

    if((this.flags & CameraContext.FLAG.AUTO_CENTER) !== 0) {
        width -= this.positionX;
        height -= this.positionY;
    }

    switch(this.scaleMode) {
        case CameraContext.SCALE_MODE.FRACTURED: {
            this.camera.setScale(this.display.getScale(width, height));
            break;
        }
        case CameraContext.SCALE_MODE.WHOLE: {
            this.camera.setScale(Math.floor(this.display.getScale(width, height)));
            break;
        }
    }
}

CameraContext.prototype.refresh = function() {
    this.updateScale();

    if((this.flags & CameraContext.FLAG.AUTO_CENTER) !== 0) {
        this.centerCameraOnScreen();
    }

    const { sViewportWidth, sViewportHeight } = this.camera;

    this.root.setSize(sViewportWidth, sViewportHeight);
}

CameraContext.prototype.setScaleMode = function(modeID) {
    switch(modeID) {
        case CameraContext.SCALE_MODE.CUSTOM: {
            this.scaleMode = CameraContext.SCALE_MODE.CUSTOM;
            this.refresh();
            break;
        }
        case CameraContext.SCALE_MODE.WHOLE: {
            this.scaleMode = CameraContext.SCALE_MODE.WHOLE;
            this.refresh();
            break;
        }
        case CameraContext.SCALE_MODE.FRACTURED: {
            this.scaleMode = CameraContext.SCALE_MODE.FRACTURED;
            this.refresh();
            break;
        }
        default: {
            console.warn(`Scale mode is not supported! ${modeID}`);
            break;
        }
    }
}

CameraContext.prototype.forceReload = function() {
    const { windowWidth, windowHeight } = this.renderer;

    this.onWindowResize(windowWidth, windowHeight);
}

CameraContext.prototype.onWindowResize = function(windowWidth, windowHeight) {
    if(this.flags & CameraContext.FLAG.USE_BUFFER) {
        if(this.flags & CameraContext.FLAG.AUTO_RESIZE_BUFFER) {
            this.setResolution(windowWidth, windowHeight);
        } else {
            this.refresh();
        }
    } else {
        this.camera.setViewportSize(windowWidth, windowHeight);
        this.refresh();
    }
}

CameraContext.prototype.setResolution = function(width, height) {
    if((this.flags & CameraContext.FLAG.USE_BUFFER)) {
        this.display.resize(width, height);
        this.camera.setViewportSize(width, height);
        this.refresh();
    }
}

CameraContext.prototype.draw = function(gameContext, display) {
    if(this.flags & CameraContext.FLAG.HIDDEN) {
        return;
    }

    display.save();
    display.translate(this.positionX, this.positionY);

    if(this.flags & CameraContext.FLAG.USE_BUFFER) {
        const { sViewportWidth, sViewportHeight } = this.camera;
        const scaledWidth = Math.floor(sViewportWidth);
        const scaledHeight = Math.floor(sViewportHeight);

        if((this.flags & CameraContext.FLAG.AUTO_RESIZE_BUFFER) === 0) {
            const { width, height } = this.display;

            display.context.beginPath();
            display.context.rect(0, 0, width, height);
            display.context.clip();
        }

        this.display.clear();
        this.camera.update(gameContext, this.display);
        this.display.copyTo(display, scaledWidth, scaledHeight);
    } else {
        this.camera.update(gameContext, display);
    }

    display.reset();
}

CameraContext.prototype.debug = function(context) {
    const { sViewportWidth, sViewportHeight } = this.camera;
    const { width, height } = this.display;

    context.globalAlpha = 1;
    context.lineWidth = 3;
    context.strokeStyle = "#eeeeee";

    if(this.flags & CameraContext.FLAG.USE_BUFFER) {
        context.strokeRect(this.positionX, this.positionY, sViewportWidth, sViewportHeight);
        context.strokeStyle = "#c2d346ff";
        context.strokeRect(this.positionX, this.positionY, width, height);
    } else {
        context.strokeRect(this.positionX, this.positionY, sViewportWidth, sViewportHeight);
    }
}

CameraContext.prototype.isColliding = function(mouseX, mouseY, mouseRange) {
    let width = 0;
    let height = 0;

    if(this.flags & CameraContext.FLAG.USE_BUFFER) {
        width = this.display.width;
        height = this.display.height;
    } else {
        width = this.camera.viewportWidth;
        height = this.camera.viewportHeight;
    }

    const isColliding = isRectangleRectangleIntersect(
        this.positionX, this.positionY, width, height,
        mouseX, mouseY, mouseRange, mouseRange
    );

    return isColliding;
}