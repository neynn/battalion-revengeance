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
    this.positionMode = CameraContext.POSITION_MODE.FIXED;
    this.displayMode = CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT;
    this.flags = CameraContext.FLAG.NONE;
    this.dragButton = Cursor.BUTTON.NONE;

    this.display = new Display();
    this.display.init(1, 1, Display.TYPE.BUFFER);
}

CameraContext.FLAG = {
    NONE: 0,
    DRAG: 1 << 0,
    RESIZE_BUFFER: 1 << 1
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
    const { windowWidth, windowHeight } = this.renderer;
    const sWorldWidth = worldWidth * scale;
    const sWorldHeight = worldHeight * scale;

    let usedWidth = 0;
    let usedHeight = 0;
    let positionX = 0;
    let positionY = 0;

    if(sWorldWidth < sViewportWidth) {
        usedWidth = sWorldWidth;
    } else {
        usedWidth = sViewportWidth;
    }

    if(sWorldHeight < sViewportHeight) {
        usedHeight = sWorldHeight;
    } else {
        usedHeight = sViewportHeight;
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

CameraContext.prototype.setDragButton = function(buttonID) {
    this.dragButton = buttonID;
}

CameraContext.prototype.enableBufferResize = function() {
    this.flags |= CameraContext.FLAG.RESIZE_BUFFER;
}

CameraContext.prototype.disableBufferResize = function() {
    this.flags &= ~CameraContext.FLAG.RESIZE_BUFFER;
}

CameraContext.prototype.setScale = function(scale) {
    if(this.displayMode === CameraContext.DISPLAY_MODE.RESOLUTION_FIXED && (this.flags & CameraContext.FLAG.RESIZE_BUFFER) !== 0) {
        this.camera.setScale(scale);
        this.refresh();
    }
}

CameraContext.prototype.updateScale = function() {
    if(this.displayMode === CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT) {
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

    if(this.positionMode === CameraContext.POSITION_MODE.AUTO_CENTER) {
        if(this.displayMode === CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT) {
            //this.camera.alignViewport(); REMOVED
        }

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

CameraContext.prototype.setPositionMode = function(modeID) {
    switch(modeID) {
        case CameraContext.POSITION_MODE.FIXED: {
            this.positionMode = CameraContext.POSITION_MODE.FIXED;
            break;
        }
        case CameraContext.POSITION_MODE.AUTO_CENTER: {
            this.positionMode = CameraContext.POSITION_MODE.AUTO_CENTER;
            this.centerCameraOnScreen();
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

CameraContext.prototype.forceReload = function() {
    const { windowWidth, windowHeight } = this.renderer;

    this.onWindowResize(windowWidth, windowHeight);
}

CameraContext.prototype.onWindowResize = function(windowWidth, windowHeight) {
    switch(this.displayMode) {
        case CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT: {
            this.camera.setViewportSize(windowWidth, windowHeight);
            this.refresh();
            break;
        }
        case CameraContext.DISPLAY_MODE.RESOLUTION_FIXED: {
            if((this.flags & CameraContext.FLAG.RESIZE_BUFFER) !== 0) {
                this.setResolution(windowWidth, windowHeight);
            }

            break;
        }
    }
}

CameraContext.prototype.setResolution = function(width, height) {
    if(this.displayMode === CameraContext.DISPLAY_MODE.RESOLUTION_FIXED) {
        this.display.resize(width, height);
        this.camera.setViewportSize(width, height);
        this.refresh();
    }
}

CameraContext.prototype.draw = function(gameContext, display) {
    switch(this.displayMode) {
        case CameraContext.DISPLAY_MODE.RESOLUTION_FIXED: {
            const { sViewportWidth, sViewportHeight } = this.camera;
            const scaledWidth = Math.floor(sViewportWidth);
            const scaledHeight = Math.floor(sViewportHeight);

            display.save();
            display.translate(this.positionX, this.positionY);

            this.display.clear();
            this.camera.update(gameContext, this.display);
            this.display.copyTo(display, scaledWidth, scaledHeight);

            display.reset();
            break;
        }
        case CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT: {
            display.save();
            display.translate(this.positionX, this.positionY);

            this.camera.update(gameContext, display);

            display.reset();
            break;
        }
    }
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