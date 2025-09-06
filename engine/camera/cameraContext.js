import { Display } from "./display.js";
import { isRectangleRectangleIntersect } from "../math/math.js";

export const CameraContext = function(id, camera, windowWidth, windowHeight) {
    this.id = id;
    this.camera = camera;
    this.positionX = 0;
    this.positionY = 0;
    this.display = new Display();
    this.scale = CameraContext.BASE_SCALE;
    this.scaleMode = CameraContext.SCALE_MODE.NONE;
    this.positionMode = CameraContext.POSITION_MODE.FIXED;
    this.displayMode = CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT;
    this.windowWidth = windowWidth;
    this.windowHeight = windowHeight;
    this.camera.setViewportSize(this.windowWidth, this.windowHeight);
    this.display.init(1, 1, Display.TYPE.BUFFER);
}

CameraContext.BASE_SCALE = 1;

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

CameraContext.prototype.getScale = function(width, height) {
    let scale = CameraContext.BASE_SCALE;
    let scaleX = CameraContext.BASE_SCALE;
    let scaleY = CameraContext.BASE_SCALE;

    switch(this.scaleMode) {
        case CameraContext.SCALE_MODE.FRACTURED: {
            scaleX = width / this.display.width;
            scaleY = height / this.display.height;
            break;
        }
        case CameraContext.SCALE_MODE.WHOLE: {
            scaleX = Math.floor(width / this.display.width);
            scaleY = Math.floor(height / this.display.height);
            break;
        }
    }

    if(scaleX < scaleY) {
        scale = scaleX;
    } else {
        scale = scaleY;
    }

    if(scale < CameraContext.BASE_SCALE) {
        scale = CameraContext.BASE_SCALE;
    }

    return scale;
}

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
}

CameraContext.prototype.centerCamera = function() {
    const { viewportWidth, viewportHeight } = this.camera;
    const positionX = (this.windowWidth - this.scale * viewportWidth) * 0.5;
    const positionY = (this.windowHeight - this.scale * viewportHeight) * 0.5;

    this.setPosition(positionX, positionY);
}

CameraContext.prototype.dragCamera = function(deltaX, deltaY) {
    const dragX = deltaX / this.scale;
    const dragY = deltaY / this.scale;

    this.camera.dragViewport(dragX, dragY);
}

CameraContext.prototype.reloadScale = function() {
    if(this.displayMode === CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT) {
        this.scale = CameraContext.BASE_SCALE;
        return;
    }

    let width = this.windowWidth;
    let height = this.windowHeight;

    if(this.positionMode === CameraContext.POSITION_MODE.FIXED) {
        width -= this.positionX;
        height -= this.positionY;
    }

    this.scale = this.getScale(width, height);
}

CameraContext.prototype.refreshFull = function() {
    this.reloadScale();

    if(this.positionMode === CameraContext.POSITION_MODE.AUTO_CENTER) {
        if(this.displayMode === CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT) {
            this.camera.alignViewport();
        }

        this.centerCamera();
    }
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
            this.camera.setViewportSize(this.windowWidth, this.windowHeight);
            this.refreshFull();
            break;
        }
        case CameraContext.DISPLAY_MODE.RESOLUTION_FIXED: {
            this.displayMode = CameraContext.DISPLAY_MODE.RESOLUTION_FIXED;
            this.camera.setViewportSize(this.display.width, this.display.height);
            this.refreshFull();
            break;
        }
        default: {
            console.warn(`DisplayMode ${modeID} is not supported!`);
            break;
        }
    }
}

CameraContext.prototype.onWindowResize = function(windowWidth, windowHeight) {
    this.windowWidth = windowWidth;
    this.windowHeight = windowHeight;

    if(this.displayMode === CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT) {
        this.camera.setViewportSize(windowWidth, windowHeight);
    }

    this.refreshFull();
}

CameraContext.prototype.setResolution = function(width, height) {
    if(this.displayMode === CameraContext.DISPLAY_MODE.RESOLUTION_FIXED) {
        this.display.resize(width, height);
        this.camera.setViewportSize(width, height);
        this.refreshFull();
    }
}

CameraContext.prototype.update = function(gameContext, display) {
    switch(this.displayMode) { 
        case CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT: {
            display.translate(this.positionX, this.positionY);

            this.camera.update(gameContext, display);
            break;
        }
        case CameraContext.DISPLAY_MODE.RESOLUTION_FIXED: {
            const { context } = display;
            const { canvas, width, height } = this.display;
            const { viewportWidth, viewportHeight } = this.camera;

            this.display.clear();
            this.camera.update(gameContext, this.display);

            context.drawImage(
                canvas,
                0, 0, width, height,
                this.positionX, this.positionY, viewportWidth * this.scale, viewportHeight * this.scale
            );
            break;
        }
    }
}

CameraContext.prototype.debug = function(context) {
    const { viewportWidth, viewportHeight } = this.camera;

    context.globalAlpha = 1;
    context.strokeStyle = "#eeeeee";
    context.lineWidth = 3;
    context.strokeRect(this.positionX, this.positionY, viewportWidth * this.scale, viewportHeight * this.scale);
}

CameraContext.prototype.isColliding = function(mouseX, mouseY, mouseRange) {
    const { viewportWidth, viewportHeight } = this.camera;
    const isColliding = isRectangleRectangleIntersect(
        this.positionX, this.positionY, viewportWidth * this.scale, viewportHeight * this.scale,
        mouseX, mouseY, mouseRange, mouseRange
    );

    return isColliding;
}