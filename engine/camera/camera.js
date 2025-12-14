export const Camera = function() {   
    this.scale = 1;
    this.fViewportX = 0;
    this.fViewportY = 0;
    this.viewportX = 0;
    this.viewportY = 0;
    this.viewportX_limit = 0;
    this.viewportY_limit = 0;
    this.viewportWidth = 0;
    this.viewportHeight = 0;
    this.wViewportWidth = 0; //WorldViewportWidth
    this.wViewportHeight = 0; //WorldViewportHeight
    this.sViewportWidth = 0; //ScreenViewportWidth
    this.sViewportHeight = 0; //ScreenViewportHeight
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

    this.fViewportX = Math.floor(this.viewportX);
    this.fViewportY = Math.floor(this.viewportY);
}

Camera.prototype.bindViewport = function() {
    this.viewportType = Camera.VIEWPORT_TYPE.BOUND;
    this.applyBounds();
}

Camera.prototype.freeViewport = function() {
    this.viewportType = Camera.VIEWPORT_TYPE.FREE;
}

Camera.prototype.reloadViewport = function() {
    this.wViewportWidth = this.viewportWidth / this.scale;
    this.wViewportHeight = this.viewportHeight / this.scale;
    this.sViewportWidth = this.viewportWidth * this.scale;
    this.sViewportHeight = this.viewportHeight * this.scale;

    if(this.worldWidth <= this.wViewportWidth) {
        this.viewportX_limit = 0;
    } else {
        this.viewportX_limit = this.worldWidth - this.wViewportWidth;
    }

    if(this.worldHeight <= this.wViewportHeight) {
        this.viewportY_limit = 0;
    } else {
        this.viewportY_limit = this.worldHeight - this.wViewportHeight;
    }

    this.applyBounds();
}

Camera.prototype.setWorldSize = function(worldWidth, worldHeight) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.reloadViewport();
}

Camera.prototype.setScale = function(scale) {
    if(scale < 0.1) {
        this.scale = 0.1;
    } else {
        this.scale = scale;
    }

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

Camera.prototype.dragViewport = function(deltaX, deltaY) {
    if(this.viewportMode === Camera.VIEWPORT_MODE.DRAG) {
        const viewportX = this.viewportX + deltaX / this.scale;
        const viewportY = this.viewportY + deltaY / this.scale;
        
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