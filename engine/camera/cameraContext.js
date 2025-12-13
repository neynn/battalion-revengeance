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
    this.scaleMode = CameraContext.SCALE_MODE.NONE;
    this.positionMode = CameraContext.POSITION_MODE.FIXED;
    this.displayMode = CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT;
    this.flags = CameraContext.FLAG.NONE;
    this.dragButton = Cursor.BUTTON.NONE;

    this.display = new Display();
    this.display.init(1, 1, Display.TYPE.BUFFER);
}

//TODO: Fix context!
CameraContext.FLAG = {
    NONE: 0,
    DRAG: 1 << 0,
    AUTO_RESIZE: 1 << 1
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

CameraContext.prototype.centerCamera = function() {
    const { sViewportWidth, sViewportHeight } = this.camera;
    const positionX = (this.renderer.windowWidth - sViewportWidth) * 0.5;
    const positionY = (this.renderer.windowHeight - sViewportHeight) * 0.5;
    const targetX = positionX < 0 ? 0 : positionX;
    const targetY = positionY < 0 ? 0 : positionY;

    this.setPosition(targetX, targetY);
}

CameraContext.prototype.allowAutoResize = function() {
    this.flags |= CameraContext.FLAG.AUTO_RESIZE;
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

CameraContext.prototype.setDragButton = function(buttonID) {
    this.dragButton = buttonID;
}

CameraContext.prototype.setScale = function(scale) {
    this.camera.setScale(scale);
    this.refresh();
}

CameraContext.prototype.updateScale = function() {
    if(this.displayMode !== CameraContext.DISPLAY_MODE.RESOLUTION_FIXED) {
        this.camera.setScale(Display.BASE_SCALE);
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
            //this.setScale(Display.BASE_SCALE);
            break;
        }
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
    //this.updateScale();

    if(this.positionMode === CameraContext.POSITION_MODE.AUTO_CENTER) {
        if(this.displayMode === CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT) {
            this.camera.alignViewport();
        }

        this.centerCamera();
    }

    const { sViewportWidth, sViewportHeight } = this.camera;

    this.root.setSize(sViewportWidth, sViewportHeight);
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

    if((this.flags & CameraContext.FLAG.AUTO_RESIZE) !== 0) {
        this.display.resize(windowWidth, windowHeight);
        this.camera.setViewportSize(windowWidth, windowHeight);
    }

    this.refresh();
}

//Scaling only works when using an offscreen buffer.
CameraContext.prototype.setResolution = function(width, height) {
    if(this.displayMode === CameraContext.DISPLAY_MODE.RESOLUTION_FIXED) {
        this.display.resize(width, height);
        this.camera.setViewportSize(width, height);
        this.refresh();
    }
}

CameraContext.prototype.drawOn = function(gameContext, display) {
    const { sViewportWidth, sViewportHeight } = this.camera;
    const scaledWidth = Math.floor(sViewportWidth);
    const scaledHeight = Math.floor(sViewportHeight);

    this.display.clear();
    this.camera.update(gameContext, this.display);
    this.display.copyTo(display, scaledWidth, scaledHeight);
}

CameraContext.prototype.debug = function(context) {
    const { sViewportWidth, sViewportHeight } = this.camera;

    context.globalAlpha = 1;
    context.lineWidth = 3;
    context.strokeStyle = "#eeeeee";
    context.strokeRect(this.positionX, this.positionY, sViewportWidth, sViewportHeight);
    context.strokeStyle = "#aaaaaa";
    context.strokeRect(this.positionX, this.positionY, this.renderer.windowWidth, this.renderer.windowHeight);
}

CameraContext.prototype.isColliding = function(mouseX, mouseY, mouseRange) {
    const { sViewportWidth, sViewportHeight } = this.camera;
    const isColliding = isRectangleRectangleIntersect(
        this.positionX, this.positionY, sViewportWidth, sViewportHeight,
        mouseX, mouseY, mouseRange, mouseRange
    );

    return isColliding;
}