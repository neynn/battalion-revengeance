import { DEBUG } from "../debug.js";
import { TILE_HEIGHT, TILE_WIDTH } from "../engine_constants.js";
import { clampValue } from "../math/math.js";
import { TextureHandle } from "../resources/texture/textureHandle.js";

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
    this.currentFrame = 0;

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

Camera2D.COLOR = {
    EMPTY_TILE_FIRST: "#000000",
    EMPTY_TILE_SECOND: "#701867"
};

Camera2D.MAP_OUTLINE = {
    LINE_SIZE: 2,
    COLOR: "#dddddd"
};

Camera2D.prototype.update = function(gameContext, renderContext) {}

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

Camera2D.prototype.drawEmptyTile = function(context, screenX, screenY, scale) {
    const drawX = Math.floor(screenX);
    const drawY = Math.floor(screenY);
    const width = Math.floor(this.halfTileWidth * scale);
    const height = Math.floor(this.halfTileHeight * scale);

    context.fillStyle = Camera2D.COLOR.EMPTY_TILE_FIRST;
    context.fillRect(drawX, drawY, width, height);
    context.fillRect(drawX + width, drawY + height, width, height);

    context.fillStyle = Camera2D.COLOR.EMPTY_TILE_SECOND;
    context.fillRect(drawX + width, drawY, width, height);
    context.fillRect(drawX, drawY + height, width, height);
}

Camera2D.prototype.drawFrame = function(context, bitmap, frame, screenX, screenY, scale) {
    const frameLength = frame.length;

    for(let i = 0; i < frameLength; i++) {
        const component = frame[i];
        const { frameX, frameY, frameW, frameH, shiftX, shiftY } = component;
        //-pivot * scale
        const drawX = Math.floor(screenX + shiftX * scale);
        const drawY = Math.floor(screenY + shiftY * scale);
        const drawWidth = Math.floor(frameW * scale);
        const drawHeight = Math.floor(frameH * scale);

        context.drawImage(
            bitmap,
            frameX, frameY, frameW, frameH,
            drawX, drawY, drawWidth, drawHeight
        );
    }
}

Camera2D.prototype.drawTile = function(tileManager, tileID, context, screenX, screenY, scale = 1) {
    const { handle, frames, frameIndex } = tileManager.getVisual(tileID);
    const { state, bitmap } = handle;

    if(state !== TextureHandle.STATE.LOADED) {
        this.drawEmptyTile(context, screenX, screenY, scale);
    } else {
        this.drawFrame(context, bitmap, frames[frameIndex], screenX, screenY, scale);
    }
}

Camera2D.prototype.drawTileClipped = function(tileManager, tileID, context, tileX, tileY) {
    let count = 0;

    //TODO(neyn): startX/startY no longer tell visibility!
    //tile - this.tile and check if > 0 && < wViewport / SIZE
    if(tileX >= this.startX && tileX <= this.endX && tileY >= this.startY && tileY <= this.endY) {
        const screenX = this.getScreenX(tileX);
        const screenY = this.getScreenY(tileY);

        this.drawTile(tileManager, tileID, context, screenX, screenY);
        count++;
    }

    return count;
}

Camera2D.prototype.drawOverlay = function(tileManager, display, overlay) {
    const { elements, count, alpha } = overlay;

    if(count === 0 || alpha === 0) {
        return 0;
    }

    const wTileX = this.tileX;
    const wTileY = this.tileY;
    const startX = this.startX;
    const startY = this.startY;
    const endX = this.endX;
    const endY = this.endY;
    const tileWidth = this.tileWidth;
    const tileHeight = this.tileHeight;
    const offsetX = this.fOffsetX;
    const offsetY = this.fOffsetY;

    const { context } = display;
    const previousAlpha = context.globalAlpha;

    let index = 0;
    let drawCount = 0;

    display.setAlpha(alpha);

    for(let i = 0; i < count; i++) {
        const tileID = elements[index];
        const tileX = elements[index + 1];
        const tileY = elements[index + 2];

        if(tileX >= startX && tileX <= endX && tileY >= startY && tileY <= endY) {
            const screenX = (tileX - wTileX) * tileWidth - offsetX;
            const screenY = (tileY - wTileY) * tileHeight - offsetY;

            this.drawTile(tileManager, tileID, context, screenX, screenY);
            drawCount++;
        }

        index += 3;
    }

    display.setAlpha(previousAlpha);

    return drawCount;
}

Camera2D.prototype.drawTileBuffer = function(tileManager, context, buffer) {
    const wTileX = this.tileX;
    const wTileY = this.tileY;
    const startX = this.startX;
    const startY = this.startY;
    const endX = this.endX;
    const endY = this.endY;
    const mapWidth = this.mapWidth;
    const tileWidth = this.tileWidth;
    const tileHeight = this.tileHeight;
    const viewportX = this.fOffsetX;
    const viewportY = this.fOffsetY;

    let count = 0;
    let renderY = (startY - wTileY) * tileHeight - viewportY;

    for(let i = startY; i <= endY; i++) {
        let index = i * mapWidth + startX;
        let renderX = (startX - wTileX) * tileWidth - viewportX;

        for(let j = startX; j <= endX; j++) {
            const tileID = buffer[index];

            if(tileID !== 0) {
                this.drawTile(tileManager, tileID, context, renderX, renderY);
                count++;
            }

            index++;
            renderX += tileWidth;
        }

        renderY += tileHeight;
    }

    return count;
}

Camera2D.prototype.drawLayer = function(tileManager, display, layer) {
    const { isDrawable, alpha, buffer } = layer;
    let count = 0;

    if(isDrawable) {
        const { context } = display;
        const previousAlpha = context.globalAlpha;

        display.unflip();
        display.setAlpha(alpha);
        count = this.drawTileBuffer(tileManager, context, buffer);
        display.setAlpha(previousAlpha);
    }

    return count;
}

Camera2D.prototype.drawSpriteLayer = function(gameContext, display, layerID) {
    const { timer, spriteManager } = gameContext;
    const { realTime, deltaTime } = timer;
    const viewportLeftEdge = this.getWorldX();
    const viewportTopEdge = this.getWorldY();
    const viewportRightEdge = viewportLeftEdge + this.wViewportWidth;
    const viewportBottomEdge = viewportTopEdge + this.wViewportHeight;
    const layer = spriteManager.getLayer(layerID);
    const length = layer.length;
    let count = 0;

    for(let i = 0; i < length; i++) {
        const sprite = layer[i];
        const isVisible = sprite.isVisible(viewportRightEdge, viewportLeftEdge, viewportBottomEdge, viewportTopEdge);

        if(isVisible) {
            sprite.update(realTime, deltaTime);
            sprite.draw(display, viewportLeftEdge, viewportTopEdge);

            if(DEBUG.SPRITES) {
                sprite.debug(display, viewportLeftEdge, viewportTopEdge);
            }

            count++;
        }
    }

    return count;
}

Camera2D.prototype.drawSortedSpriteLayer = function(gameContext, display, layerID) {
    const { timer, spriteManager } = gameContext;
    const { realTime, deltaTime } = timer;
    const viewportLeftEdge = this.getWorldX();
    const viewportTopEdge = this.getWorldY();
    const viewportRightEdge = viewportLeftEdge + this.wViewportWidth;
    const viewportBottomEdge = viewportTopEdge + this.wViewportHeight;
    const layer = spriteManager.getLayer(layerID);
    const length = layer.length;
    const sprites = [];
    let count = 0;

    for(let i = 0; i < length; i++) {
        const sprite = layer[i];
        const isVisible = sprite.isVisible(viewportRightEdge, viewportLeftEdge, viewportBottomEdge, viewportTopEdge);

        if(isVisible) {
            sprites.push(sprite);
            count++;
        }
    }

    sprites.sort((current, next) => current.positionY - next.positionY);

    for(let i = 0; i < count; i++) {
        const sprite = sprites[i];

        sprite.update(realTime, deltaTime);
        sprite.draw(display, viewportLeftEdge, viewportTopEdge);

        if(DEBUG.SPRITES) {
            sprite.debug(display, viewportLeftEdge, viewportTopEdge);
        }
    }

    return count;
}

Camera2D.prototype.drawTilesWithCallback = function(onDraw) {
    let count = 0;

    for(let i = this.startY; i <= this.endY; i++) {
        const renderY = this.getScreenY(i);
        let index = i * this.mapWidth + this.startX;

        for(let j = this.startX; j <= this.endX; j++) {
            const renderX = this.getScreenX(j);

            onDraw(j, i, index, renderX, renderY);
            count++;
            index++;
        }
    }

    return count;
}

Camera2D.prototype.drawMapOutlines = function(context) {
    const endX = this.endX + 1;
    const endY = this.endY + 1;

    context.fillStyle = Camera2D.MAP_OUTLINE.COLOR;

    for(let i = this.startY; i <= endY; i++) {
        const renderY = this.getScreenY(i);

        context.fillRect(0, renderY, this.wViewportWidth, Camera2D.MAP_OUTLINE.LINE_SIZE);
    }

    for (let j = this.startX; j <= endX; j++) {
        const renderX = this.getScreenX(j);

        context.fillRect(renderX, 0, Camera2D.MAP_OUTLINE.LINE_SIZE, this.wViewportHeight);
    }
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