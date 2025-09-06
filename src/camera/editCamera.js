import { Pallet } from "../../engine/map/editor/pallet.js";
import { Renderer } from "../../engine/renderer.js";
import { SpriteManager } from "../../engine/sprite/spriteManager.js";
import { BattalionMap } from "../map/battalionMap.js";
import { BattalionCamera } from "./battalionCamera.js";

export const EditCamera = function() {
    BattalionCamera.call(this);

    this.tileID = Pallet.ID.ERROR;
    this.tileName = "";
    this.drawRange = 0;
    this.overlayAlpha = 0.75;
    this.overlayColor = "#eeeeee";
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
    this.clampWorldBounds();
    this.floorRenderCoordinates();
    this.drawLayer(tileManager, display, worldMap.getLayer(BattalionMap.LAYER.GROUND));
    this.drawLayer(tileManager, display, worldMap.getLayer(BattalionMap.LAYER.DECORATION));
    this.drawSpriteBatch(display, spriteManager.getLayer(SpriteManager.LAYER.BOTTOM), realTime, deltaTime);
    this.drawSpriteBatch(display, spriteManager.getLayer(SpriteManager.LAYER.MIDDLE), realTime, deltaTime);
    this.drawSpriteBatch(display, spriteManager.getLayer(SpriteManager.LAYER.TOP), realTime, deltaTime);
    this.drawSpriteBatch(display, spriteManager.getLayer(SpriteManager.LAYER.UI), realTime, deltaTime);
    this.drawLayer(tileManager, display, worldMap.getLayer(BattalionMap.LAYER.CLOUD));
    this.drawHoverTile(gameContext, context);

    if(Renderer.DEBUG.MAP) {
        this.debugMap(context, worldMap);
    }
}

EditCamera.prototype.drawHoverTile = function(gameContext, context) {
    if(this.tileID === Pallet.ID.ERROR) {
        return;
    }

    const { tileManager, transform2D } = gameContext;
    const { tileWidth, tileHeight, halfTileWidth } = transform2D;
    const { x, y } = gameContext.getMouseTile();

    context.globalAlpha = this.overlayAlpha;
    context.fillStyle = this.overlayColor;
    context.textAlign = "center";

    const startX = x - this.drawRange;
    const startY = y - this.drawRange;
    const endX = x + this.drawRange;
    const endY = y + this.drawRange;

    for(let i = startY; i <= endY; i++) {
        for(let j = startX; j <= endX; j++) {
            const renderY = i * tileHeight - this.screenY;
            const renderX = j * tileWidth - this.screenX;

            this.drawTileSafe(tileManager, this.tileID, context, renderX, renderY);

            context.fillText(this.tileName, renderX + halfTileWidth, renderY);
        }
    }
}

EditCamera.prototype.onBrushUpdate = function(brush) {
    const { id, name, size } = brush;

    this.tileID = id;
    this.tileName = name;
    this.drawRange = size;
}