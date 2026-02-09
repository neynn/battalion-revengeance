import { clampValue } from "../math/math.js";
import { Renderer } from "../renderer/renderer.js";
import { Camera } from "./camera.js";

export const Camera2D = function() {
    Camera.call(this);

    this.startX = 0;
    this.startY = 0;
    this.endX = -1;
    this.endY = -1;
    this.mapWidth = 0;
    this.mapHeight = 0;
    this.tileWidth = 1;
    this.tileHeight = 1;
    this.halfTileWidth = 1;
    this.halfTileHeight = 1;
}

Camera2D.COLOR = {
    EMPTY_TILE_FIRST: "#000000",
    EMPTY_TILE_SECOND: "#701867"
};

Camera2D.MAP_OUTLINE = {
    LINE_SIZE: 2,
    COLOR: "#dddddd"
};

Camera2D.prototype = Object.create(Camera.prototype);
Camera2D.prototype.constructor = Camera2D;

Camera2D.prototype.onMapSizeUpdate = function(oldWidth, oldHeight) {}

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
    const { visual } = tileManager.getTile(tileID);
    const { texture, frames, frameIndex } = visual;
    const { bitmap } = texture;

    if(bitmap === null) {
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

Camera2D.prototype.drawSpriteBatch = function(display, spriteBatch, realTime, deltaTime) {
    const viewportLeftEdge = this.fViewportX;
    const viewportTopEdge = this.fViewportY;
    const viewportRightEdge = viewportLeftEdge + this.wViewportWidth;
    const viewportBottomEdge = viewportTopEdge + this.wViewportHeight;
    const length = spriteBatch.length;
    let count = 0;

    for(let i = 0; i < length; i++) {
        const sprite = spriteBatch[i];
        const isVisible = sprite.isVisible(viewportRightEdge, viewportLeftEdge, viewportBottomEdge, viewportTopEdge);

        if(isVisible) {
            sprite.update(realTime, deltaTime);
            sprite.draw(display, viewportLeftEdge, viewportTopEdge);

            if(Renderer.DEBUG.SPRITES) {
                sprite.debug(display, viewportLeftEdge, viewportTopEdge);
            }

            count++;
        }
    }

    return count;
}

Camera2D.prototype.drawSpriteBatchYSorted = function(display, spriteBatch, realTime, deltaTime) {
    const viewportLeftEdge = this.fViewportX;
    const viewportTopEdge = this.fViewportY;
    const viewportRightEdge = viewportLeftEdge + this.wViewportWidth;
    const viewportBottomEdge = viewportTopEdge + this.wViewportHeight;
    const length = spriteBatch.length;
    const visibleSprites = [];

    for(let i = 0; i < length; i++) {
        const sprite = spriteBatch[i];
        const isVisible = sprite.isVisible(viewportRightEdge, viewportLeftEdge, viewportBottomEdge, viewportTopEdge);

        if(isVisible) {
            visibleSprites.push(sprite);
        }
    }

    visibleSprites.sort((current, next) => current.positionY - next.positionY);
    
    for(let i = 0; i < visibleSprites.length; i++) {
        const sprite = visibleSprites[i];

        sprite.update(realTime, deltaTime);
        sprite.draw(display, viewportLeftEdge, viewportTopEdge);
    }

    if(Renderer.DEBUG.SPRITES) {
        for(let i = 0; i < visibleSprites.length; i++) {
            const sprite = visibleSprites[i];
    
            sprite.debug(display, viewportLeftEdge, viewportTopEdge);
        }
    }

    return visibleSprites.length;
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