import { Display } from "./display.js";
import { isRectangleRectangleIntersect } from "../math/math.js";

export const CameraContext = function(id, camera, root) {
    this.id = id;
    this.camera = camera;
    this.root = root;
    this.width = 0;
    this.height = 0;
    this.positionX = 0;
    this.positionY = 0;
    this.display = new Display();
    this.scale = Display.BASE_SCALE;
    this.scaleMode = CameraContext.SCALE_MODE.NONE;
    this.positionMode = CameraContext.POSITION_MODE.FIXED;
    this.displayMode = CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT;
    this.display.init(1, 1, Display.TYPE.BUFFER);
    this.isDragging = false;
}

CameraContext.POSITION_MODE = {
    FIXED: 0,
    AUTO_CENTER: 1
};

CameraContext.DISPLAY_MODE = {
    RESOLUTION_DEPENDENT: 0,
    RESOLUTION_FIXED: 1
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

CameraContext.prototype.setSize = function(width, height) {
    //width and height is the total area occupied, NOT the display area.
    //TODO: this must not know about total area occupied.
    //this should basically be this.display.width.
    this.width = width;
    this.height = height;

    if(this.displayMode === CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT) {
        this.camera.setViewportSize(width, height);
    }

    this.refresh();
}

CameraContext.prototype.centerCamera = function() {
    const { viewportWidth, viewportHeight } = this.camera;
    const positionX = (this.width - this.scale * viewportWidth) * 0.5;
    const positionY = (this.height - this.scale * viewportHeight) * 0.5;

    this.setPosition(positionX, positionY);
}

CameraContext.prototype.enableDrag = function() {
    this.isDragging = true;
}

CameraContext.prototype.disableDrag = function() {
    this.isDragging = false;
}

CameraContext.prototype.dragCamera = function(deltaX, deltaY) {
    if(this.isDragging) {
        const dragX = deltaX / this.scale;
        const dragY = deltaY / this.scale;

        this.camera.dragViewport(dragX, dragY);
    }
}

CameraContext.prototype.reloadScale = function() {
    if(this.displayMode === CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT) {
        this.scale = Display.BASE_SCALE;
        return;
    }

    let width = this.width;
    let height = this.height;

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
            this.scale = this.display.getScaleFractured(width, height);
            break;
        }
        case CameraContext.SCALE_MODE.WHOLE: {
            this.scale = this.display.getScaleWhole(width, height);
            break;
        }
    }
}

CameraContext.prototype.refresh = function() {
    this.reloadScale();

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
            this.reloadScale();
            break;
        }
        case CameraContext.SCALE_MODE.WHOLE: {
            this.scaleMode = CameraContext.SCALE_MODE.WHOLE;
            this.reloadScale();
            break;
        }
        case CameraContext.SCALE_MODE.FRACTURED: {
            this.scaleMode = CameraContext.SCALE_MODE.FRACTURED;
            this.reloadScale();
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
        case CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT: {
            this.displayMode = CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT;
            this.camera.setViewportSize(this.width, this.height);
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
    //TODO: Decouple the context size from the window size.
    this.setSize(windowWidth, windowHeight);
}

CameraContext.prototype.setResolution = function(width, height) {
    if(this.displayMode === CameraContext.DISPLAY_MODE.RESOLUTION_FIXED) {
        this.display.resize(width, height);
        this.camera.setViewportSize(width, height);
        this.refresh();
    }
}

CameraContext.prototype.update = function(gameContext, mainDisplay) {
    if(!this.camera.isActive) {
        return;
    }
    
    switch(this.displayMode) { 
        case CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT: {
            mainDisplay.translate(this.positionX, this.positionY);

            this.camera.update(gameContext, mainDisplay);
            break;
        }
        case CameraContext.DISPLAY_MODE.RESOLUTION_FIXED: {
            const { canvas, width, height } = this.display;
            const scaledWidth = Math.floor(this.getVisibleWidth());
            const scaledHeight = Math.floor(this.getVisibleHeight());

            this.display.clear();
            this.camera.update(gameContext, this.display);

            mainDisplay.context.drawImage(
                canvas,
                0, 0, width, height,
                this.positionX, this.positionY, scaledWidth, scaledHeight
            );
            break;
        }
    }
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
    context.strokeRect(this.positionX, this.positionY, this.width, this.height);
}

CameraContext.prototype.isColliding = function(mouseX, mouseY, mouseRange) {
    const isColliding = isRectangleRectangleIntersect(
        this.positionX, this.positionY, this.getVisibleWidth(), this.getVisibleHeight(),
        mouseX, mouseY, mouseRange, mouseRange
    );

    return isColliding;
}