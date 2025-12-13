import { getCursorTile } from "../../engine/camera/contextHelper.js";
import { Renderer } from "../../engine/renderer/renderer.js";
import { TileManager } from "../../engine/tile/tileManager.js";
import { LAYER_TYPE } from "../enums.js";
import { BattalionMap } from "../map/battalionMap.js";
import { BattalionCamera } from "./battalionCamera.js";

export const EditCamera = function(brush) {
    BattalionCamera.call(this);

    this.overlayAlpha = 0.75;
    this.overlayColor = "#eeeeee";
    this.brush = brush;
}

EditCamera.prototype = Object.create(BattalionCamera.prototype);
EditCamera.prototype.constructor = EditCamera;

EditCamera.prototype.update = function(gameContext, display) {
    const { world, timer, spriteManager, tileManager } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return;
    }
    
    const { context } = display;
    const deltaTime = timer.getDeltaTime();
    const realTime = timer.getRealTime();

    this.updateWorldBounds();
    this.drawLayer(tileManager, display, worldMap.getLayer(BattalionMap.LAYER.GROUND));
    this.drawLayer(tileManager, display, worldMap.getLayer(BattalionMap.LAYER.DECORATION));
    this.drawSpriteBatch(display, spriteManager.getLayer(LAYER_TYPE.BUILDING), realTime, deltaTime);
    this.drawSpriteBatch(display, spriteManager.getLayer(LAYER_TYPE.SEA), realTime, deltaTime);
    this.drawSpriteBatch(display, spriteManager.getLayer(LAYER_TYPE.LAND), realTime, deltaTime);
    this.drawLayer(tileManager, display, worldMap.getLayer(BattalionMap.LAYER.CLOUD));
    this.drawHoverTile(gameContext, context);

    if(Renderer.DEBUG.MAP) {
        this.debugMap(display, worldMap);
    }
}

EditCamera.prototype.drawHoverTile = function(gameContext, context) {
    const { id, name, width, height } = this.brush;

    if(id === TileManager.TILE_ID.INVALID) {
        return;
    }

    const { tileManager, transform2D } = gameContext;
    const { tileWidth, tileHeight, halfTileWidth } = transform2D;
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
            const renderY = i * tileHeight - this.fViewportY;
            const renderX = j * tileWidth - this.fViewportX;

            this.drawTile(tileManager, id, context, renderX, renderY);

            context.fillText(name, renderX + halfTileWidth, renderY);
        }
    }
}