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
    this.scale = Display.BASE_SCALE;
    this.scaleMode = CameraContext.SCALE_MODE.NONE;
    this.positionMode = CameraContext.POSITION_MODE.FIXED;
    this.displayMode = CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT;
    this.flags = CameraContext.FLAG.NONE;
    this.dragButton = Cursor.BUTTON.NONE;

    this.display = new Display();
    this.display.init(1, 1, Display.TYPE.BUFFER);
}

CameraContext.FLAG = {
    NONE: 0,
    DRAG: 1 << 0
};

CameraContext.POSITION_MODE = {
    FIXED: 0,
    AUTO_CENTER: 1
};

CameraContext.DISPLAY_MODE = {
    NONE: 0,
    RESOLUTION_DEPENDENT: 1,
    RESOLUTION_FIXED: 2
};

CameraContext.SCALE_MODE = {
    NONE: 0,
    WHOLE: 1,
    FRACTURED: 2
};

CameraContext.prototype.getID = function() {
    return this.id;
}

CameraContext.prototype.getCamera = function() {
    return this.camera;
}

CameraContext.prototype.getWorldPosition = function(screenX, screenY) {
    const { viewportX, viewportY } = this.camera;

    return {
        "x": (screenX - this.positionX) / this.scale + viewportX,
        "y": (screenY - this.positionY) / this.scale + viewportY
    }
}

CameraContext.prototype.setPosition = function(x, y) {
    this.positionX = Math.floor(x);
    this.positionY = Math.floor(y);
    this.root.setPosition(this.positionX, this.positionY);
}

CameraContext.prototype.centerCamera = function() {
    const { viewportWidth, viewportHeight } = this.camera;
    const positionX = (this.renderer.windowWidth - this.scale * viewportWidth) * 0.5;
    const positionY = (this.renderer.windowHeight - this.scale * viewportHeight) * 0.5;

    this.setPosition(positionX, positionY);
}

CameraContext.prototype.startDrag = function(buttonID, buttonX, buttonY, buttonR) {
    if(this.dragButton === buttonID && this.isColliding(buttonX, buttonY, buttonR)) {
        this.flags |= CameraContext.FLAG.DRAG;
    }
}

CameraContext.prototype.updateDrag = function(buttonID, deltaX, deltaY) {
    if(this.dragButton === buttonID && (this.flags & CameraContext.FLAG.DRAG) !== 0) {
        const dragX = deltaX / this.scale;
        const dragY = deltaY / this.scale;

        this.camera.dragViewport(dragX, dragY);
    }
}

CameraContext.prototype.endDrag = function(buttonID) {
    if(this.dragButton === buttonID) {
        this.flags &= ~CameraContext.FLAG.DRAG;
    }
}

CameraContext.prototype.setDragButton = function(buttonID) {
    this.dragButton = buttonID;
}

CameraContext.prototype.updateScale = function() {
    if(this.displayMode !== CameraContext.DISPLAY_MODE.RESOLUTION_FIXED) {
        this.scale = Display.BASE_SCALE;
        return;
    }

    let width = this.renderer.windowWidth;
    let height = this.renderer.windowHeight;

    if(this.positionMode === CameraContext.POSITION_MODE.FIXED) {
        width -= this.positionX;
        height -= this.positionY;
    }

    switch(this.scaleMode) {
        case CameraContext.SCALE_MODE.NONE: {
            this.scale = Display.BASE_SCALE;
            break;
        }
        case CameraContext.SCALE_MODE.FRACTURED: {
            this.scale = this.display.getScale(width, height);
            break;
        }
        case CameraContext.SCALE_MODE.WHOLE: {
            this.scale = Math.floor(this.display.getScale(width, height));
            break;
        }
    }
}

CameraContext.prototype.refresh = function() {
    this.updateScale();

    if(this.positionMode === CameraContext.POSITION_MODE.AUTO_CENTER) {
        if(this.displayMode === CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT) {
            this.camera.alignViewport();
        }

        this.centerCamera();
    }

    const visibleWidth = this.getVisibleWidth();
    const visibleHeight = this.getVisibleHeight();

    this.root.setSize(visibleWidth, visibleHeight);
}

CameraContext.prototype.setScaleMode = function(modeID) {
    switch(modeID) {
        case CameraContext.SCALE_MODE.NONE: {
            this.scaleMode = CameraContext.SCALE_MODE.NONE;
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

CameraContext.prototype.setPositionMode = function(modeID) {
    switch(modeID) {
        case CameraContext.POSITION_MODE.FIXED: {
            this.positionMode = CameraContext.POSITION_MODE.FIXED;
            break;
        }
        case CameraContext.POSITION_MODE.AUTO_CENTER: {
            this.positionMode = CameraContext.POSITION_MODE.AUTO_CENTER;
            this.centerCamera();
            break;
        }
        default: {
            console.warn(`Position mode is not supported! ${modeID}`);
            break;
        }
    }
}

CameraContext.prototype.setDisplayMode = function(modeID) {
    switch(modeID) {
        case CameraContext.DISPLAY_MODE.NONE: {
            this.displayMode = CameraContext.DISPLAY_MODE.NONE;
            this.refresh();
            break;
        }
        case CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT: {
            this.displayMode = CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT;
            this.camera.setViewportSize(this.renderer.windowWidth, this.renderer.windowHeight);
            this.refresh();
            break;
        }
        case CameraContext.DISPLAY_MODE.RESOLUTION_FIXED: {
            this.displayMode = CameraContext.DISPLAY_MODE.RESOLUTION_FIXED;
            this.camera.setViewportSize(this.display.width, this.display.height);
            this.refresh();
            break;
        }
        default: {
            console.warn(`DisplayMode ${modeID} is not supported!`);
            break;
        }
    }
}

CameraContext.prototype.onWindowResize = function(windowWidth, windowHeight) {
    if(this.displayMode === CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT) {
        this.camera.setViewportSize(windowWidth, windowHeight);
    }

    this.refresh();
}

CameraContext.prototype.setResolution = function(width, height) {
    if(this.displayMode === CameraContext.DISPLAY_MODE.RESOLUTION_FIXED) {
        this.display.resize(width, height);
        this.camera.setViewportSize(width, height);
        this.refresh();
    }
}

CameraContext.prototype.drawOn = function(gameContext, display) {
    const scaledWidth = Math.floor(this.getVisibleWidth());
    const scaledHeight = Math.floor(this.getVisibleHeight());

    this.display.clear();
    this.camera.update(gameContext, this.display);
    this.display.copyTo(display, scaledWidth, scaledHeight);
}

CameraContext.prototype.getVisibleWidth = function() {
    return this.camera.viewportWidth * this.scale;
}

CameraContext.prototype.getVisibleHeight = function() {
    return this.camera.viewportHeight * this.scale;
}

CameraContext.prototype.debug = function(context) {
    context.globalAlpha = 1;
    context.lineWidth = 3;
    context.strokeStyle = "#eeeeee";
    context.strokeRect(this.positionX, this.positionY, this.getVisibleWidth(), this.getVisibleHeight());
    context.strokeStyle = "#aaaaaa";
    context.strokeRect(this.positionX, this.positionY, this.renderer.windowWidth, this.renderer.windowHeight);
}

CameraContext.prototype.isColliding = function(mouseX, mouseY, mouseRange) {
    const isColliding = isRectangleRectangleIntersect(
        this.positionX, this.positionY, this.getVisibleWidth(), this.getVisibleHeight(),
        mouseX, mouseY, mouseRange, mouseRange
    );

    return isColliding;
}