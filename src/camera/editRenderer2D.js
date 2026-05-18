import { getCursorTile } from "../../engine/camera/contextHelper.js";
import { Renderer2D } from "../../engine/renderer/renderer2D.js";
import { TileManager } from "../../engine/tile/tileManager.js";
import { LAYER_TYPE, TILE_ID } from "../enums.js";
import { BattalionMap } from "../map/battalionMap.js";
import { BattalionRenderer2D } from "./battalionRenderer2D.js";

export const EditRenderer2D = function(brush) {
    BattalionRenderer2D.call(this);

    this.overlayAlpha = 0.75;
    this.overlayColor = "#eeeeee";
    this.brush = brush;
}

EditRenderer2D.prototype = Object.create(BattalionRenderer2D.prototype);
EditRenderer2D.prototype.constructor = EditRenderer2D;

/**
 * 
 * @param {*} gameContext 
 * @param {Camera2D} camera 
 * @param {Display} display 
 * @param {WorldMap} worldMap 
 * @returns 
 */
EditRenderer2D.prototype.drawTiles = function(gameContext, camera, display, worldMap) {
    const { tileManager } = gameContext;
    const { context } = display;
    const bottomLayer = worldMap.getLayer(BattalionMap.LAYER.GROUND);
    const middleLayer = worldMap.getLayer(BattalionMap.LAYER.DECORATION);
    const topLayer = worldMap.getLayer(BattalionMap.LAYER.CLOUD);

    const bottomBuffer = bottomLayer.buffer;
    const bottomAlpha = bottomLayer.alpha;
    const middleBuffer = middleLayer.buffer;
    const middleAlpha = middleLayer.alpha;
    const topBuffer = topLayer.buffer;
    const topAlpha = topLayer.alpha;

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

    let inspectedEntity = null;
    let entityCount = 0;
    let tileCount = 0;
    let renderY = (startY - wTileY) * tileHeight - viewportY;

    display.setAlpha(1);
    
    for(let i = startY; i <= endY; i++) {
        let index = i * mapWidth + startX;
        let renderX = (startX - wTileX) * tileWidth - viewportX;

        for(let j = startX; j <= endX; j++) {
            const bottomID = bottomBuffer[index];
            const middleID = middleBuffer[index];
            const topID = topBuffer[index];

            if(bottomID !== 0) {
                context.globalAlpha = bottomAlpha;
                this.drawTile(tileManager, bottomID, context, renderX, renderY);
                tileCount++;
            }

            if(middleID !== 0) {
                context.globalAlpha = middleAlpha;
                this.drawTile(tileManager, middleID, context, renderX, renderY);
                tileCount++;
            }

            if(topID !== 0) {
                context.globalAlpha = topAlpha;
                this.drawTile(tileManager, topID, context, renderX, renderY);
                tileCount++;
            }

            index++;
            renderX += tileWidth;
        }

        renderY += tileHeight;
    }

    return tileCount;
}

EditRenderer2D.prototype.render = function(gameContext, camera, display) {
    const { world, tileManager } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return;
    }

    camera.updateWorldBounds(worldMap.width, worldMap.height);

    this.drawTiles(gameContext, camera, display, worldMap);

    if(this.showAllJammers) {
        this.drawJammers(camera, tileManager, display, worldMap);
    }

    this.drawEntities(gameContext, camera, display, worldMap);
    this.drawSpriteLayer(gameContext, camera, display, LAYER_TYPE.BUILDING);
    this.drawHoverTile(gameContext, camera, display);

    if(Renderer2D.DEBUG.WORLD) {
        this.debugMap(camera, display, worldMap);
    }
}

EditRenderer2D.prototype.drawHoverTile = function(gameContext, camera, display) {
    const { context } = display;
    const { id, name, width, height } = this.brush;

    if(id === TileManager.TILE_ID.INVALID) {
        return;
    }

    const { tileManager } = gameContext;
    const { x, y } = getCursorTile(gameContext);

    context.globalAlpha = this.overlayAlpha;
    context.fillStyle = this.overlayColor;
    context.textAlign = "center";

    const startX = x - width;
    const startY = y - height;
    const endX = x + width;
    const endY = y + height;

    for(let i = startY; i <= endY; i++) {
        for(let j = startX; j <= endX; j++) {
            const screenX = camera.getScreenX(j);
            const screenY = camera.getScreenY(i);

            this.drawTile(tileManager, id, context, screenX, screenY);
            this.drawTile(tileManager, TILE_ID.JAMMER, context, screenX, screenY);

            context.fillText(name, screenX + this.halfTileWidth, screenY);
        }
    }
}