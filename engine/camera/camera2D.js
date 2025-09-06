import { clampValue } from "../math/math.js";
import { Renderer } from "../renderer.js";
import { Camera } from "./camera.js";

export const Camera2D = function() {
    Camera.call(this);

    this.mapWidth = 0;
    this.mapHeight = 0;
    this.tileWidth = -1;
    this.tileHeight = -1;
    this.halfTileWidth = -1;
    this.halfTileHeight = -1;
    this.startX = -1;
    this.startY = -1;
    this.endX = -1;
    this.endY = -1;
    this.scaleX = 1;
    this.scaleY = 1;
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

Camera2D.prototype.onMapSizeUpdate = function() {}

Camera2D.prototype.setRelativeScale = function(tileWidth, tileHeight) {
    //TODO: Add pixel clipping.
    this.scaleX = tileWidth / this.tileWidth;
    this.scaleY = tileHeight / this.tileHeight;
}

Camera.prototype.resetScale = function() {
    this.scaleX = 1;
    this.scaleY = 1;
}

Camera2D.prototype.drawEmptyTile = function(context, renderX, renderY) {
    const width = this.halfTileWidth * this.scaleX;
    const height = this.halfTileHeight * this.scaleY;

    context.fillStyle = Camera2D.COLOR.EMPTY_TILE_FIRST;
    context.fillRect(renderX, renderY, width, height);
    context.fillRect(renderX + width, renderY + height, width, height);

    context.fillStyle = Camera2D.COLOR.EMPTY_TILE_SECOND;
    context.fillRect(renderX + width, renderY, width, height);
    context.fillRect(renderX, renderY + height, width, height);
}

Camera2D.prototype.drawTileSafe = function(tileManager, tileID, context, renderX, renderY) {
    const container = tileManager.getContainer(tileID);
    const { texture, frames, frameIndex } = container;
    const { bitmap } = texture;

    if(bitmap === null) {
        this.drawEmptyTile(context, renderX, renderY);
    } else {
        this.drawFrame(context, bitmap, frames[frameIndex], renderX, renderY);
    }
}

Camera2D.prototype.drawFrame = function(context, bitmap, frame, renderX, renderY) {
    const frameLength = frame.length;
    const scaleX = this.scaleX;
    const scaleY = this.scaleY;

    for(let i = 0; i < frameLength; ++i) {
        const component = frame[i];
        const { frameX, frameY, frameW, frameH, shiftX, shiftY } = component;
        const drawX = renderX + shiftX * scaleX;
        const drawY = renderY + shiftY * scaleY;
        const drawWidth = frameW * scaleX;
        const drawHeight = frameH * scaleY;

        context.drawImage(
            bitmap,
            frameX, frameY, frameW, frameH,
            drawX, drawY, drawWidth, drawHeight
        );
    }
}

Camera2D.prototype.drawTile = function(container, context, renderX, renderY) {
    const { texture, frames, frameIndex } = container;
    const { bitmap } = texture;
    const currentFrame = frames[frameIndex];
    const frameLength = currentFrame.length;
    const scaleX = this.scaleX;
    const scaleY = this.scaleY;

    for(let i = 0; i < frameLength; ++i) {
        const component = currentFrame[i];
        const { frameX, frameY, frameW, frameH, shiftX, shiftY } = component;
        const drawX = renderX + shiftX * scaleX;
        const drawY = renderY + shiftY * scaleY;
        const drawWidth = frameW * scaleX;
        const drawHeight = frameH * scaleY;

        context.drawImage(
            bitmap,
            frameX, frameY, frameW, frameH,
            drawX, drawY, drawWidth, drawHeight
        );
    }
}

Camera2D.prototype.drawOverlay = function(tileManager, context, overlay) {
    const startX = this.startX;
    const startY = this.startY;
    const endX = this.endX;
    const endY = this.endY;
    const tileWidth = this.tileWidth;
    const tileHeight = this.tileHeight;
    const viewportX = this.screenX;
    const viewportY = this.screenY;
    const { elements, count } = overlay;

    for(let i = 0; i < count; i++) {
        const index = i * 3;
        const id = elements[index];
        const x = elements[index + 1];
        const y = elements[index + 2];

        if(x >= startX && x <= endX && y >= startY && y <= endY) {
            const renderX = x * tileWidth - viewportX;
            const renderY = y * tileHeight - viewportY;

            this.drawTileSafe(tileManager, id, context, renderX, renderY);
        }
    }
}

Camera2D.prototype.drawLayer = function(tileManager, display, layer) {
    const { alpha, buffer } = layer;
    
    if(alpha > 0) {
        const { context } = display;
        const previousAlpha = context.globalAlpha;

        display.unflip();
        display.setAlpha(alpha);

        this.drawTileBuffer(tileManager, context, buffer);

        display.setAlpha(previousAlpha);
    }
}

Camera2D.prototype.drawTileBuffer = function(tileManager, context, buffer) {
    const startX = this.startX;
    const startY = this.startY;
    const endX = this.endX;
    const endY = this.endY;
    const mapWidth = this.mapWidth;
    const tileWidth = this.tileWidth;
    const tileHeight = this.tileHeight;
    const viewportX = this.screenX;
    const viewportY = this.screenY;

    for(let i = startY; i <= endY; ++i) {
        const tileRow = i * mapWidth;
        const renderY = i * tileHeight - viewportY;

        for(let j = startX; j <= endX; ++j) {
            const index = tileRow + j;
            const tileID = buffer[index];

            if(tileID !== 0) {
                const renderX = j * tileWidth - viewportX;

                this.drawTileSafe(tileManager, tileID, context, renderX, renderY);
            }
        }
    }
}

Camera2D.prototype.drawSprite = function(display, sprite, realTime, deltaTime) {
    const viewportLeftEdge = this.screenX;
    const viewportTopEdge = this.screenY;
    const viewportRightEdge = viewportLeftEdge + this.viewportWidth;
    const viewportBottomEdge = viewportTopEdge + this.viewportHeight;
    const isVisible = sprite.isVisible(viewportRightEdge, viewportLeftEdge, viewportBottomEdge, viewportTopEdge);

    if(isVisible) {
        sprite.update(realTime, deltaTime);
        sprite.draw(display, viewportLeftEdge, viewportTopEdge);
    }
}

Camera2D.prototype.drawSpriteBatch = function(display, spriteBatch, realTime, deltaTime) {
    const viewportLeftEdge = this.screenX;
    const viewportTopEdge = this.screenY;
    const viewportRightEdge = viewportLeftEdge + this.viewportWidth;
    const viewportBottomEdge = viewportTopEdge + this.viewportHeight
    const length = spriteBatch.length;

    for(let i = 0; i < length; ++i) {
        const sprite = spriteBatch[i];
        const isVisible = sprite.isVisible(viewportRightEdge, viewportLeftEdge, viewportBottomEdge, viewportTopEdge);

        if(isVisible) {
            sprite.update(realTime, deltaTime);
            sprite.draw(display, viewportLeftEdge, viewportTopEdge);

            if(Renderer.DEBUG.SPRITES) {
                sprite.debug(display, viewportLeftEdge, viewportTopEdge);
            }
        }
    }
}

Camera2D.prototype.drawSpriteBatchYSorted = function(display, spriteBatch, realTime, deltaTime) {
    const viewportLeftEdge = this.screenX;
    const viewportTopEdge = this.screenY;
    const viewportRightEdge = viewportLeftEdge + this.viewportWidth;
    const viewportBottomEdge = viewportTopEdge + this.viewportHeight
    const length = spriteBatch.length;
    const visibleSprites = [];

    for(let i = 0; i < length; ++i) {
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
}

Camera2D.prototype.drawBufferData = function(context, buffer, offsetX, offsetY) {
    const drawX = Math.floor(offsetX - this.screenX);
    const drawY = Math.floor(offsetY - this.screenY);

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
        const renderY = i * this.tileHeight - this.screenY;

        context.fillRect(0, renderY, this.viewportWidth, Camera2D.MAP_OUTLINE.LINE_SIZE);
    }

    for (let j = this.startX; j <= endX; j++) {
        const renderX = j * this.tileWidth - this.screenX;

        context.fillRect(renderX, 0, Camera2D.MAP_OUTLINE.LINE_SIZE, this.viewportHeight);
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

    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;

    this.setWorldSize(worldWidth, worldHeight);
    this.onMapSizeUpdate();
}

Camera2D.prototype.updateWorldBounds = function() {
    const offsetX = 0;
    const offsetY = 1;

    this.startX = Math.floor(this.viewportX / this.tileWidth);
    this.startY = Math.floor(this.viewportY / this.tileHeight);
    this.endX = Math.floor((this.viewportX + this.viewportWidth) / this.tileWidth) + offsetX;
    this.endY = Math.floor((this.viewportY + this.viewportHeight) / this.tileHeight) + offsetY;
}

Camera2D.prototype.clampWorldBounds = function() {
    this.startX = clampValue(this.startX, this.mapWidth - 1, 0);
    this.startY = clampValue(this.startY, this.mapHeight - 1, 0);
    this.endX = clampValue(this.endX, this.mapWidth - 1, 0);
    this.endY = clampValue(this.endY, this.mapHeight - 1, 0);
}