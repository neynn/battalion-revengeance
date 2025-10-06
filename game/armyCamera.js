import { Renderer } from "../engine/renderer.js";
import { Camera2D } from "../engine/camera/camera2D.js";
import { DEBRIS_TYPE } from "./enums.js";

export const ArmyCamera = function() {
    Camera2D.call(this);

    this.overlays = [];
    this.customLayers = [];
}

ArmyCamera.prototype = Object.create(Camera2D.prototype);
ArmyCamera.prototype.constructor = ArmyCamera;

ArmyCamera.prototype.drawDebris = function(gameContext, context, worldMap) {
    const { tileManager } = gameContext;
    const { debris } = worldMap;

    const defaultDebris = gameContext.getDebrisType(DEBRIS_TYPE.DEBRIS);
    const defaultDebrisID = tileManager.getTileIDByArray(defaultDebris.texture);
    const scorchedDebris = gameContext.getDebrisType(DEBRIS_TYPE.SCORCHED_GROUND);
    const scorchedDebrisID = tileManager.getTileIDByArray(scorchedDebris.texture);

    context.globalAlpha = 1;

    for(const [index, item] of debris) {
        const { type, x, y } = item;

        if(x >= this.startX && x <= this.endX && y >= this.startY && y <= this.endY) {
            const renderX = x * this.tileWidth - this.screenX;
            const renderY = y * this.tileHeight - this.screenY;

            switch(type) {
                case DEBRIS_TYPE.DEBRIS: {
                    this.drawTileSafe(tileManager, defaultDebrisID, context, renderX, renderY);
                    break;
                }
                case DEBRIS_TYPE.SCORCHED_GROUND: {
                    this.drawTileSafe(tileManager, scorchedDebrisID, context, renderX, renderY);
                    break;
                }
            }
        }   
    }
}

ArmyCamera.prototype.drawDrops = function(display, worldMap) {
    const dropElements = worldMap.drops.drops;
    const viewportLeftEdge = this.screenX;
    const viewportTopEdge = this.screenY;
    const viewportRightEdge = viewportLeftEdge + this.viewportWidth;
    const viewportBottomEdge = viewportTopEdge + this.viewportHeight;

    for(let i = 0; i < dropElements.length; i++) {
        const { sprite, positionX, positionY } = dropElements[i];
        const isVisible = sprite.isVisibleStatic(positionX, positionY, viewportRightEdge, viewportLeftEdge, viewportBottomEdge, viewportTopEdge);

        if(isVisible) {
            const drawX = Math.floor(viewportLeftEdge - positionX);
            const drawY = Math.floor(viewportTopEdge - positionY);

            sprite.draw(display, drawX, drawY);

            if(Renderer.DEBUG.SPRITES) {
                sprite.debug(display, drawX, drawY);
            }
        }
    }
}

ArmyCamera.prototype.initCustomLayers = function(gameContext) {
    const { tileManager } = gameContext;
    const tileCount = tileManager.getTileCount();
    const bufferSize = this.mapWidth * this.mapHeight;

    for(let i = 0; i < this.customLayers.length; i++) {
        this.customLayers[i].initBuffer(bufferSize, tileCount);
    }
}

ArmyCamera.prototype.onMapSizeUpdate = function(oldWidth, oldHeight) {
    for(let i = 0; i < this.customLayers.length; i++) {
        this.customLayers[i].resize(oldWidth, oldHeight, this.mapWidth, this.mapHeight);
    }
}

ArmyCamera.prototype.pushOverlay = function(index, tileID, positionX, positionY) {
    if(index >= 0 && index < this.overlays.length) {
        this.overlays[index].add(tileID, positionX, positionY);
    }
}

ArmyCamera.prototype.clearOverlay = function(index) {
    if(index >= 0 && index < this.overlays.length) {
        this.overlays[index].clear();
    }
}

ArmyCamera.prototype.getLayer = function(index) {
    if(index < 0 || index >= this.customLayers.length) {
        return null;
    }

    return this.customLayers[index];
}