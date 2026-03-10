import { DEBUG } from "../debug.js";
import { clampValue } from "../math/math.js";
import { TextureHandle } from "../resources/texture/textureHandle.js";

export const Camera2D = function() {
    //These values record the current tile position of the camera2D.
    //offsetX and offsetY are the offsets of the tile position.
    //startX, startY, endX, endY are the positions INSIDE the buffer.
    this.tileX = 0;
    this.tileY = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.startX = 0;
    this.startY = 0;
    this.endX = -1;
    this.endY = -1;
    this.mapWidth = 0;
    this.mapHeight = 0;
    this.tileWidth = 1;
    this.tileHeight = 1;
    this.halfTileWidth = 0.5;
    this.halfTileHeight = 0.5;
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
    this.viewportMode = Camera2D.VIEWPORT_MODE.DRAG;
    this.viewportType = Camera2D.VIEWPORT_TYPE.BOUND;
    this.currentFrame = 0;

    //worldWidth and worldHeight are no longer needed, as are NOT viewportX, viewportY
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

Camera2D.prototype.applyBounds = function() {
    if(this.viewportType === Camera2D.VIEWPORT_TYPE.BOUND) {
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

Camera2D.prototype.bindViewport = function() {
    this.viewportType = Camera2D.VIEWPORT_TYPE.BOUND;
    this.applyBounds();
}

Camera2D.prototype.freeViewport = function() {
    this.viewportType = Camera2D.VIEWPORT_TYPE.FREE;
}

Camera2D.prototype.reloadViewport = function() {
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

Camera2D.prototype.setWorldSize = function(worldWidth, worldHeight) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.reloadViewport();
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

Camera2D.prototype.moveViewport = function(viewportX, viewportY) {
    if(this.viewportMode !== Camera2D.VIEWPORT_MODE.FIXED) {
        this.viewportX = viewportX;
        this.viewportY = viewportY;
        this.applyBounds();
    }
}

Camera2D.prototype.dragViewport = function(deltaX, deltaY) {
    if(this.viewportMode === Camera2D.VIEWPORT_MODE.DRAG) {
        const viewportX = this.viewportX + deltaX / this.scale;
        const viewportY = this.viewportY + deltaY / this.scale;
        
        this.moveViewport(viewportX, viewportY);
    }
}

Camera2D.prototype.centerViewportOn = function(positionX, positionY) {
    const viewportX = positionX - this.viewportWidth / 2;
    const viewportY = positionY - this.viewportHeight / 2;

    this.moveViewport(viewportX, viewportY);
}

Camera2D.prototype.centerViewportOnWorld = function() {
    const viewportX = this.worldWidth / 2;
    const viewportY = this.worldHeight / 2;

    this.centerViewportOn(viewportX, viewportY);
}

Camera2D.prototype.onMapSizeUpdate = function(oldWidth, oldHeight) {}

Camera2D.prototype.getRenderedArea = function() {
    return (this.endY - this.startY + 1) * (this.endX - this.startX + 1);
}

Camera2D.prototype.isTileVisible = function(tileX, tileY) {
    return tileX >= this.startX && tileX <= this.endX && tileY >= this.startY && tileY <= this.endY;
}

Camera2D.prototype.tileXToScreen = function(tileX) {
    return tileX * this.tileWidth - this.fViewportX;
}

Camera2D.prototype.tileYToScreen = function(tileY) {
    return tileY * this.tileHeight - this.fViewportY;
}

Camera2D.prototype.jumpToTile = function(tileX, tileY) {
    const positionX = this.tileWidth * tileX;
    const positionY = this.tileHeight * tileY;

    this.moveViewport(positionX, positionY);
}

Camera2D.prototype.drawEmptyTile = function(context, renderX, renderY, scale) {
    const drawX = Math.floor(renderX);
    const drawY = Math.floor(renderY);
    const width = Math.floor(this.halfTileWidth * scale);
    const height = Math.floor(this.halfTileHeight * scale);

    context.fillStyle = Camera2D.COLOR.EMPTY_TILE_FIRST;
    context.fillRect(drawX, drawY, width, height);
    context.fillRect(drawX + width, drawY + height, width, height);

    context.fillStyle = Camera2D.COLOR.EMPTY_TILE_SECOND;
    context.fillRect(drawX + width, drawY, width, height);
    context.fillRect(drawX, drawY + height, width, height);
}

Camera2D.prototype.drawFrame = function(context, bitmap, frame, renderX, renderY, scale) {
    const frameLength = frame.length;

    for(let i = 0; i < frameLength; i++) {
        const component = frame[i];
        const { frameX, frameY, frameW, frameH, shiftX, shiftY } = component;
        //-pivot * scale
        const drawX = Math.floor(renderX + shiftX * scale);
        const drawY = Math.floor(renderY + shiftY * scale);
        const drawWidth = Math.floor(frameW * scale);
        const drawHeight = Math.floor(frameH * scale);

        context.drawImage(
            bitmap,
            frameX, frameY, frameW, frameH,
            drawX, drawY, drawWidth, drawHeight
        );
    }
}

Camera2D.prototype.drawTile = function(tileManager, tileID, context, renderX, renderY, scale = 1) {
    const { handle, frames, frameIndex } = tileManager.getVisual(tileID);
    const { state, bitmap } = handle;

    if(state !== TextureHandle.STATE.LOADED) {
        this.drawEmptyTile(context, renderX, renderY, scale);
    } else {
        this.drawFrame(context, bitmap, frames[frameIndex], renderX, renderY, scale);
    }
}

Camera2D.prototype.drawTileClipped = function(tileManager, tileID, context, tileX, tileY) {
    let count = 0;

    if(tileX >= this.startX && tileX <= this.endX && tileY >= this.startY && tileY <= this.endY) {
        const renderX = this.tileWidth * tileX - this.fViewportX;
        const renderY = this.tileHeight * tileY - this.fViewportY;

        this.drawTile(tileManager, tileID, context, renderX, renderY);
        count++;
    }

    return count;
}

Camera2D.prototype.drawOverlay = function(tileManager, display, overlay) {
    const { elements, count, alpha } = overlay;

    if(count === 0 || alpha === 0) {
        return 0;
    }

    const startX = this.startX;
    const startY = this.startY;
    const endX = this.endX;
    const endY = this.endY;
    const tileWidth = this.tileWidth;
    const tileHeight = this.tileHeight;
    const viewportX = this.fViewportX;
    const viewportY = this.fViewportY;

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
            const renderX = tileX * tileWidth - viewportX;
            const renderY = tileY * tileHeight - viewportY;

            this.drawTile(tileManager, tileID, context, renderX, renderY);
            drawCount++;
        }

        index += 3;
    }

    display.setAlpha(previousAlpha);

    return drawCount;
}

Camera2D.prototype.drawTileBuffer = function(tileManager, context, buffer) {
    const startX = this.startX;
    const startY = this.startY;
    const endX = this.endX;
    const endY = this.endY;
    const mapWidth = this.mapWidth;
    const tileWidth = this.tileWidth;
    const tileHeight = this.tileHeight;
    const viewportX = this.fViewportX;
    const viewportY = this.fViewportY;

    let count = 0;
    let renderY = startY * tileHeight - viewportY;

    for(let i = startY; i <= endY; i++) {
        let index = i * mapWidth + startX;
        let renderX = startX * tileWidth - viewportX;

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
    const viewportLeftEdge = this.fViewportX;
    const viewportTopEdge = this.fViewportY;
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
    const viewportLeftEdge = this.fViewportX;
    const viewportTopEdge = this.fViewportY;
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
        const renderY = i * this.tileHeight - this.fViewportY;
        const tileRow = i * this.mapWidth;

        for(let j = this.startX; j <= this.endX; j++) {
            const renderX = j * this.tileWidth - this.fViewportX;
            const index = tileRow + j;

            onDraw(j, i, index, renderX, renderY);
            count++;
        }
    }

    return count;
}

Camera2D.prototype.drawBufferData = function(context, buffer, offsetX, offsetY) {
    const drawX = Math.floor(offsetX - this.fViewportX);
    const drawY = Math.floor(offsetY - this.fViewportY);

    for(let i = this.startY; i <= this.endY; i++) {
        const renderY = i * this.tileHeight + drawY;
        const tileRow = i * this.mapWidth;

        for(let j = this.startX; j <= this.endX; j++) {
            const renderX = j * this.tileWidth + drawX;
            const index = tileRow + j;
            const tileID = buffer[index];

            context.fillText(tileID, renderX, renderY);
        }
    }
}

Camera2D.prototype.drawMapOutlines = function(context) {
    const endX = this.endX + 1;
    const endY = this.endY + 1;

    context.fillStyle = Camera2D.MAP_OUTLINE.COLOR;

    for(let i = this.startY; i <= endY; i++) {
        const renderY = i * this.tileHeight - this.fViewportY;

        context.fillRect(0, renderY, this.wViewportWidth, Camera2D.MAP_OUTLINE.LINE_SIZE);
    }

    for (let j = this.startX; j <= endX; j++) {
        const renderX = j * this.tileWidth - this.fViewportX;

        context.fillRect(renderX, 0, Camera2D.MAP_OUTLINE.LINE_SIZE, this.wViewportHeight);
    }
}

Camera2D.prototype.setTileSize = function(tileWidth, tileHeight) {
    const worldWidth = this.mapWidth * tileWidth;
    const worldHeight = this.mapHeight * tileHeight;

    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
    this.halfTileWidth = tileWidth / 2;
    this.halfTileHeight = tileHeight / 2;

    this.setWorldSize(worldWidth, worldHeight);
}

Camera2D.prototype.setMapSize = function(mapWidth, mapHeight) {
    const worldWidth = mapWidth * this.tileWidth;
    const worldHeight = mapHeight * this.tileHeight;
    const oldWidth = this.mapWidth;
    const oldHeight = this.mapHeight;

    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;

    this.setWorldSize(worldWidth, worldHeight);
    this.onMapSizeUpdate(oldWidth, oldHeight);
}

Camera2D.prototype.updateWorldBounds = function() {
    const offsetX = 0;
    const offsetY = 1;
    const startX = Math.floor(this.viewportX / this.tileWidth);
    const startY = Math.floor(this.viewportY / this.tileHeight);
    const endX = Math.floor((this.viewportX + this.wViewportWidth) / this.tileWidth) + offsetX;
    const endY = Math.floor((this.viewportY + this.wViewportHeight) / this.tileHeight) + offsetY;

    this.startX = clampValue(startX, this.mapWidth - 1, 0);
    this.startY = clampValue(startY, this.mapHeight - 1, 0);
    this.endX = clampValue(endX, this.mapWidth - 1, 0);
    this.endY = clampValue(endY, this.mapHeight - 1, 0);
}

Camera2D.prototype.tryLoadingWorldSize = function(gameContext) {
    const { world } = gameContext;
    const { mapManager } = world;
    const activeMap = mapManager.getActiveMap();

    if(activeMap) {
        const { width, height } = activeMap;

        this.setWorldSize(width, height);
        this.setMapSize(width, height);
    }
}