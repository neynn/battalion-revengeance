import { TILE_HEIGHT, TILE_WIDTH } from "../engine_constants.js";
import { clampValue } from "../math/math.js";

export const Camera2D = function() {
    this.tileX = 0;
    this.tileY = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.fOffsetX = 0;
    this.fOffsetY = 0;

    this.startX = 0;
    this.startY = 0;
    this.endX = -1;
    this.endY = -1;
    this.mapWidth = 0;
    this.mapHeight = 0;

    this.tileWidth = TILE_WIDTH;
    this.tileHeight = TILE_HEIGHT;
    this.halfTileWidth = TILE_WIDTH / 2;
    this.halfTileHeight = TILE_HEIGHT / 2;
    this.scale = 1;

    this.viewportWidth = 0;
    this.viewportHeight = 0;
    this.wViewportWidth = 0; //WorldViewportWidth
    this.wViewportHeight = 0; //WorldViewportHeight
    this.sViewportWidth = 0; //ScreenViewportWidth
    this.sViewportHeight = 0; //ScreenViewportHeight
    this.viewportMode = Camera2D.VIEWPORT_MODE.DRAG;
    this.viewportType = Camera2D.VIEWPORT_TYPE.BOUND;

    this.doUpdate = false;
}

Camera2D.VIEWPORT_TYPE = {
    FREE: 0,
    BOUND: 1
};

Camera2D.VIEWPORT_MODE = {
    FIXED: 0,
    FOLLOW: 1,
    DRAG: 2
};

Camera2D.prototype.getWorldX = function() {
    return this.tileX * this.tileWidth + this.fOffsetX;
}

Camera2D.prototype.getWorldY = function() {
    return this.tileY * this.tileHeight + this.fOffsetY;
}

Camera2D.prototype.getScreenX = function(tileX) {
    return (tileX - this.tileX) * this.tileWidth - this.fOffsetX;
}

Camera2D.prototype.getScreenY = function(tileY) {
    return (tileY - this.tileY) * this.tileHeight - this.fOffsetY;
}

Camera2D.prototype.applyBounds = function() {
    if(this.viewportType === Camera2D.VIEWPORT_TYPE.BOUND) {
        const visibleTilesX = Math.floor(this.wViewportWidth / this.tileWidth);
        const visibleTilesY = Math.floor(this.wViewportHeight / this.tileHeight);

        let xLimit = 0;
        let yLimit = 0;

        if(this.mapWidth > visibleTilesX) {
            xLimit = this.mapWidth - visibleTilesX;
        }

        if(this.mapHeight > visibleTilesY) {
            yLimit = this.mapHeight - visibleTilesY;
        }

        if(this.tileX < 0) {
            this.tileX = 0;
        } else if(this.tileX >= xLimit) {
            this.tileX = xLimit;
        }
    
        if(this.tileY < 0) {
            this.tileY = 0;
        } else if(this.tileY >= yLimit) {
            this.tileY = yLimit;
        }

        if(this.tileX === xLimit && this.offsetX > 0) {
            this.offsetX = 0;
        } 

        if(this.tileY === yLimit && this.offsetY > 0) {
            this.offsetY = 0;
        }

        if(this.tileX === 0 && this.offsetX < 0) {
            this.offsetX = 0;
        }

        if(this.tileY === 0 && this.offsetY < 0) {
            this.offsetY = 0;
        }
    }

    this.fOffsetX = Math.floor(this.offsetX);
    this.fOffsetY = Math.floor(this.offsetY);
}

Camera2D.prototype.bindViewport = function() {
    this.viewportType = Camera2D.VIEWPORT_TYPE.BOUND;
    this.applyBounds();
}

Camera2D.prototype.freeViewport = function() {
    this.viewportType = Camera2D.VIEWPORT_TYPE.FREE;
}

Camera2D.prototype.reloadViewport = function() {
    this.wViewportWidth = Math.floor(this.viewportWidth / this.scale);
    this.wViewportHeight = Math.floor(this.viewportHeight / this.scale);
    this.sViewportWidth = Math.floor(this.viewportWidth * this.scale);
    this.sViewportHeight = Math.floor(this.viewportHeight * this.scale);
    this.applyBounds();
}

Camera2D.prototype.setScale = function(scale) {
    const MIN_SCALE = 1;

    if(scale < MIN_SCALE) {
        this.scale = MIN_SCALE;
    } else {
        this.scale = scale;
    }

    this.reloadViewport();
}

Camera2D.prototype.setViewportSize = function(width, height) {
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.reloadViewport();
}

Camera2D.prototype.applyOffset = function() {
    if(this.viewportMode === Camera2D.VIEWPORT_MODE.FIXED) {
        this.offsetX = 0;
        this.offsetY = 0;
    } else {
        while(this.offsetX <= -this.tileWidth) {
            this.offsetX += this.tileWidth;
            this.tileX--;
        }
        
        while(this.offsetX >= this.tileWidth) {
            this.offsetX -= this.tileWidth;
            this.tileX++;
        }
        
        while(this.offsetY <= -this.tileHeight) {
            this.offsetY += this.tileHeight;
            this.tileY--;
        } 
        
        while(this.offsetY >= this.tileHeight) {
            this.offsetY -= this.tileHeight;
            this.tileY++;
        }

        this.applyBounds();
    }
}

Camera2D.prototype.dragViewport = function(deltaX, deltaY) {
    if(this.viewportMode === Camera2D.VIEWPORT_MODE.DRAG) {
        this.offsetX += deltaX / this.scale;
        this.offsetY += deltaY / this.scale;
        this.applyOffset();
    }
}

Camera2D.prototype.getRenderedArea = function() {
    return (this.endY - this.startY + 1) * (this.endX - this.startX + 1);
}

Camera2D.prototype.isTileVisible = function(tileX, tileY) {
    return tileX >= this.startX && tileX <= this.endX && tileY >= this.startY && tileY <= this.endY;
}

Camera2D.prototype.tileXToScreen = function(tileX) {
    return tileX * this.tileWidth - this.fOffsetX;
}

Camera2D.prototype.tileYToScreen = function(tileY) {
    return tileY * this.tileHeight - this.fOffsetY;
}

Camera2D.prototype.jumpToTile = function(tileX, tileY) {
    this.tileX = tileX;
    this.tileY = tileY;
    this.offsetX = 0;
    this.offsetY = 0;
    this.applyBounds();
}

Camera2D.prototype.setTileSize = function(tileWidth, tileHeight) {
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
    this.halfTileWidth = tileWidth / 2;
    this.halfTileHeight = tileHeight / 2;
    this.applyBounds();
}

Camera2D.prototype.updateWorldBounds = function(width, height) {
    if(this.mapWidth !== width || this.mapHeight !== height) {
        this.mapWidth = width;
        this.mapHeight = height;
        this.applyBounds();
        this.doUpdate = true;
    }

    const startX = this.tileX - 1;
    const startY = this.tileY - 1;
    const endX = Math.floor(this.wViewportWidth / this.tileWidth) + this.tileX + 1;
    const endY = Math.floor(this.wViewportHeight / this.tileHeight) + this.tileY + 1;

    this.startX = clampValue(startX, this.mapWidth - 1, 0);
    this.startY = clampValue(startY, this.mapHeight - 1, 0);
    this.endX = clampValue(endX, this.mapWidth - 1, 0);
    this.endY = clampValue(endY, this.mapHeight - 1, 0);
}