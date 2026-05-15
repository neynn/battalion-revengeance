import { Camera2D } from "../camera/camera2D.js";
import { DEBUG } from "../debug.js";
import { TILE_FRAME_SIZE, TILE_HEIGHT, TILE_WIDTH } from "../engine_constants.js";
import { TextureHandle } from "../resources/texture/textureHandle.js";

export const Renderer2D = function() {
    this.currentFrame = 0;
    this.tileWidth = TILE_WIDTH;
    this.tileHeight = TILE_HEIGHT;
    this.halfTileHeight = this.tileWidth / 2;
    this.halfTileHeight = this.tileHeight / 2;
}

Renderer2D.COLOR = {
    EMPTY_TILE_FIRST: "#000000",
    EMPTY_TILE_SECOND: "#701867"
};

Renderer2D.MAP_OUTLINE = {
    LINE_SIZE: 2,
    COLOR: "#dddddd"
};

Renderer2D.prototype.render = function(gameContext, camera, context) {}

Renderer2D.prototype.drawEmptyTile = function(context, screenX, screenY, scale) {
    const drawX = Math.floor(screenX);
    const drawY = Math.floor(screenY);
    const width = Math.floor(this.halfTileWidth * scale);
    const height = Math.floor(this.halfTileHeight * scale);

    context.fillStyle = Renderer2D.COLOR.EMPTY_TILE_FIRST;
    context.fillRect(drawX, drawY, width, height);
    context.fillRect(drawX + width, drawY + height, width, height);

    context.fillStyle = Renderer2D.COLOR.EMPTY_TILE_SECOND;
    context.fillRect(drawX + width, drawY, width, height);
    context.fillRect(drawX, drawY + height, width, height);
}

Renderer2D.prototype.drawFrame = function(context, bitmap, frame, screenX, screenY, scale) {
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

Renderer2D.prototype.drawTile = function(tileManager, tileID, context, screenX, screenY, scale = 1) {
    const { handle, frameData, framePtr } = tileManager.getVisual(tileID);
    const { state, bitmap } = handle;

    switch(state) {
        case TextureHandle.STATE.EMPTY:
        case TextureHandle.STATE.LOADING: {
            this.drawEmptyTile(context, screenX, screenY, scale);
            break;
        }
        case TextureHandle.STATE.LOADED: {
            const count = frameData[framePtr]; 
            let frame_ptr = framePtr;

            for(let i = 0; i < count; i++) {
                const frameX = frameData[frame_ptr + 1];
                const frameY = frameData[frame_ptr + 2];
                const width = frameData[frame_ptr + 3];
                const height = frameData[frame_ptr + 4];
                const offsetX = frameData[frame_ptr + 5];
                const offsetY = frameData[frame_ptr + 6];

                context.drawImage(
                    bitmap,
                    frameX, frameY, width, height,
                    Math.floor(screenX + offsetX * scale), Math.floor(screenY + offsetY * scale),
                    Math.floor(width * scale), Math.floor(height * scale)
                );

                frame_ptr += TILE_FRAME_SIZE;
            }

            break;
        }
    }
}

Renderer2D.prototype.drawTileClipped = function(camera, tileManager, tileID, context, tileX, tileY) {
    const { startX, endX, startY, endY } = camera;
    let count = 0;

    //TODO(neyn): startX/startY no longer tell visibility!
    //tile - this.tile and check if > 0 && < wViewport / SIZE
    if(tileX >= startX && tileX <= endX && tileY >= startY && tileY <= endY) {
        const screenX = camera.getScreenX(tileX);
        const screenY = camera.getScreenY(tileY);

        this.drawTile(tileManager, tileID, context, screenX, screenY);
        count++;
    }

    return count;
}

Renderer2D.prototype.drawOverlay = function(camera, tileManager, display, overlay) {
    const { elements, count, alpha } = overlay;

    if(count === 0 || alpha === 0) {
        return 0;
    }

    const wTileX = camera.tileX;
    const wTileY = camera.tileY;
    const startX = camera.startX;
    const startY = camera.startY;
    const endX = camera.endX;
    const endY = camera.endY;
    const tileWidth = camera.tileWidth;
    const tileHeight = camera.tileHeight;
    const offsetX = camera.fOffsetX;
    const offsetY = camera.fOffsetY;

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

Renderer2D.prototype.drawTileBuffer = function(camera, tileManager, context, buffer) {
    const wTileX = camera.tileX;
    const wTileY = camera.tileY;
    const startX = camera.startX;
    const startY = camera.startY;
    const endX = camera.endX;
    const endY = camera.endY;
    const mapWidth = camera.mapWidth;
    const tileWidth = camera.tileWidth;
    const tileHeight = camera.tileHeight;
    const viewportX = camera.fOffsetX;
    const viewportY = camera.fOffsetY;

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

Renderer2D.prototype.drawLayer = function(camera, tileManager, display, layer) {
    const { isDrawable, alpha, buffer } = layer;
    let count = 0;

    if(isDrawable) {
        const { context } = display;
        const previousAlpha = context.globalAlpha;

        display.unflip();
        display.setAlpha(alpha);
        count = this.drawTileBuffer(camera, tileManager, context, buffer);
        display.setAlpha(previousAlpha);
    }

    return count;
}

Renderer2D.prototype.drawSpriteLayer = function(gameContext, camera, display, layerID) {
    const { timer, spriteManager } = gameContext;
    const { realTime, deltaTime } = timer;
    const viewportLeftEdge = camera.getWorldX();
    const viewportTopEdge = camera.getWorldY();
    const viewportRightEdge = viewportLeftEdge + camera.wViewportWidth;
    const viewportBottomEdge = viewportTopEdge + camera.wViewportHeight;
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

Renderer2D.prototype.drawSortedSpriteLayer = function(gameContext, camera, display, layerID) {
    const { timer, spriteManager } = gameContext;
    const { realTime, deltaTime } = timer;
    const viewportLeftEdge = camera.getWorldX();
    const viewportTopEdge = camera.getWorldY();
    const viewportRightEdge = viewportLeftEdge + camera.wViewportWidth;
    const viewportBottomEdge = viewportTopEdge + camera.wViewportHeight;
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

Renderer2D.prototype.drawTilesWithCallback = function(camera, onDraw) {
    const { startY, endY, mapWidth, startX, endX } = camera;
    let count = 0;

    for(let i = startY; i <= endY; i++) {
        const renderY = camera.getScreenY(i);
        let index = i * mapWidth + startX;

        for(let j = startX; j <= endX; j++) {
            const renderX = camera.getScreenX(j);

            onDraw(j, i, index, renderX, renderY);
            count++;
            index++;
        }
    }

    return count;
}

Renderer2D.prototype.drawMapOutlines = function(camera, context) {
    const endX = camera.endX + 1;
    const endY = camera.endY + 1;

    context.fillStyle = Renderer2D.MAP_OUTLINE.COLOR;

    for(let i = camera.startY; i <= endY; i++) {
        const renderY = camera.getScreenY(i);

        context.fillRect(0, renderY, camera.wViewportWidth, Renderer2D.MAP_OUTLINE.LINE_SIZE);
    }

    for (let j = camera.startX; j <= endX; j++) {
        const renderX = camera.getScreenX(j);

        context.fillRect(renderX, 0, Renderer2D.MAP_OUTLINE.LINE_SIZE, camera.wViewportHeight);
    }
}