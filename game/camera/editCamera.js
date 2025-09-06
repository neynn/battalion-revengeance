import { Pallet } from "../../engine/map/editor/pallet.js";
import { Renderer } from "../../engine/renderer.js";
import { SpriteManager } from "../../engine/sprite/spriteManager.js";
import { ArmyCamera } from "../armyCamera.js";
import { ArmyMap } from "../init/armyMap.js";

export const EditCamera = function() {
    ArmyCamera.call(this);

    this.tileID = Pallet.ID.ERROR;
    this.tileName = "";
    this.drawRange = 0;
    this.overlayAlpha = 0.75;
    this.overlayColor = "#eeeeee";
}

EditCamera.prototype = Object.create(ArmyCamera.prototype);
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
    this.drawLayer(tileManager, display, worldMap.getLayer(ArmyMap.LAYER.GROUND));
    this.drawLayer(tileManager, display, worldMap.getLayer(ArmyMap.LAYER.DECORATION));
    this.drawDebris(gameContext, context, worldMap);
    this.drawSpriteBatch(display, spriteManager.getLayer(SpriteManager.LAYER.BOTTOM), realTime, deltaTime);
    this.drawSpriteBatch(display, spriteManager.getLayer(SpriteManager.LAYER.MIDDLE), realTime, deltaTime);
    this.drawSpriteBatch(display, spriteManager.getLayer(SpriteManager.LAYER.TOP), realTime, deltaTime);
    this.drawSpriteBatch(display, spriteManager.getLayer(SpriteManager.LAYER.UI), realTime, deltaTime);
    this.drawLayer(tileManager, display, worldMap.getLayer(ArmyMap.LAYER.CLOUD));
    this.drawHoverTile(gameContext, context);

    if(Renderer.DEBUG.MAP) {
        this.debugMap(context, worldMap);
    }
}

EditCamera.prototype.debugMap = function(context, worldMap) {
    const scaleX = this.tileWidth / 6;
    const scaleY = this.tileHeight / 6;

    context.globalAlpha = 1;
    context.font = `${scaleX}px Arial`;
    context.textBaseline = "middle";
    context.textAlign = "center";

    context.fillStyle = "#ff0000";
    this.drawBufferData(context, worldMap.getLayer(ArmyMap.LAYER.TYPE).buffer, scaleX, scaleY);

    context.fillStyle = "#00ff00";
    this.drawBufferData(context, worldMap.getLayer(ArmyMap.LAYER.TEAM).buffer, this.tileWidth - scaleX, scaleY);

    context.fillStyle = "#ffff00";
    this.drawBufferData(context, worldMap.getLayer(ArmyMap.LAYER.GROUND).buffer, this.tileWidth - scaleX, this.tileHeight - scaleY);

    this.drawMapOutlines(context);
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

EditCamera.prototype.setOverlay = function(color, alpha) {
    if(color) {
        this.overlayColor = color;
    }

    if(alpha) {
        this.overlayAlpha = alpha;
    }
}