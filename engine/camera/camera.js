export const Camera = function() {    
    this.viewportX = 0;
    this.viewportY = 0;
    this.viewportX_limit = 0;
    this.viewportY_limit = 0;
    this.viewportWidth = 0;
    this.viewportHeight = 0;
    this.screenX = 0;
    this.screenY = 0;
    this.worldWidth = 0;
    this.worldHeight = 0;
    this.viewportMode = Camera.VIEWPORT_MODE.DRAG;
    this.viewportType = Camera.VIEWPORT_TYPE.BOUND;
}

Camera.VIEWPORT_TYPE = {
    FREE: 0,
    BOUND: 1
};

Camera.VIEWPORT_MODE = {
    FIXED: 0,
    FOLLOW: 1,
    DRAG: 2
};

Camera.prototype.update = function(gameContext, renderContext) {}

Camera.prototype.floorRenderCoordinates = function() {
    this.screenX = Math.floor(this.viewportX);
    this.screenY = Math.floor(this.viewportY);
}

Camera.prototype.applyBounds = function() {
    if(this.viewportType === Camera.VIEWPORT_TYPE.BOUND) {
        if(this.viewportX < 0) {
            this.viewportX = 0;
        } else if(this.viewportX >= this.viewportX_limit) {
            this.viewportX = this.viewportX_limit;
        }
    
        if(this.viewportY < 0) {
            this.viewportY = 0;
        } else if(this.viewportY >= this.viewportY_limit) {
            this.viewportY = this.viewportY_limit;
        }
    }
}

Camera.prototype.bindViewport = function() {
    this.viewportType = Camera.VIEWPORT_TYPE.BOUND;
    this.applyBounds();
}

Camera.prototype.freeViewport = function() {
    this.viewportType = Camera.VIEWPORT_TYPE.FREE;
}

Camera.prototype.reloadViewport = function() {
    if(this.worldWidth <= this.viewportWidth) {
        this.viewportX_limit = 0;
    } else {
        this.viewportX_limit = this.worldWidth - this.viewportWidth;
    }

    if(this.worldHeight <= this.viewportHeight) {
        this.viewportY_limit = 0;
    } else {
        this.viewportY_limit = this.worldHeight - this.viewportHeight;
    }

    this.applyBounds();
}

Camera.prototype.alignViewport = function() {
    if(this.worldWidth !== 0 && this.viewportWidth !== 0 && this.worldWidth < this.viewportWidth) {
        this.viewportWidth = this.worldWidth;
    }

    if(this.worldHeight !== 0 && this.viewportHeight !== 0 && this.worldHeight < this.viewportHeight) {
        this.viewportHeight = this.worldHeight;
    }

    this.reloadViewport();
}

Camera.prototype.setWorldSize = function(worldWidth, worldHeight) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    this.reloadViewport();
}

Camera.prototype.setViewportSize = function(width, height) {
    this.viewportWidth = width;
    this.viewportHeight = height;

    this.reloadViewport();
}

Camera.prototype.moveViewport = function(viewportX, viewportY) {
    if(this.viewportMode !== Camera.VIEWPORT_MODE.FIXED) {
        this.viewportX = viewportX;
        this.viewportY = viewportY;

        this.applyBounds();
    }
}

Camera.prototype.dragViewport = function(dragX, dragY) {
    if(this.viewportMode === Camera.VIEWPORT_MODE.DRAG) {
        const viewportX = this.viewportX + dragX;
        const viewportY = this.viewportY + dragY;
        
        this.moveViewport(viewportX, viewportY);
    }
}

Camera.prototype.centerViewportOn = function(positionX, positionY) {
    const viewportX = positionX - this.viewportWidth / 2;
    const viewportY = positionY - this.viewportHeight / 2;

    this.moveViewport(viewportX, viewportY);
}

Camera.prototype.centerViewportOnWorld = function() {
    const viewportX = this.worldWidth / 2;
    const viewportY = this.worldHeight / 2;

    this.centerViewportOn(viewportX, viewportY);
}