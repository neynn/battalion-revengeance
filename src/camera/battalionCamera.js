import { Camera2D } from "../../engine/camera/camera2D.js";
import { Renderer } from "../../engine/renderer.js";
import { SpriteManager } from "../../engine/sprite/spriteManager.js";
import { BattalionMap } from "../map/battalionMap.js";

export const BattalionCamera = function() {
    Camera2D.call(this);
}

BattalionCamera.prototype = Object.create(Camera2D.prototype);
BattalionCamera.prototype.constructor = BattalionCamera;

BattalionCamera.prototype.update = function(gameContext, display) {
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
    this.drawSpriteBatchYSorted(display, spriteManager.getLayer(SpriteManager.LAYER.BOTTOM), realTime, deltaTime);
    this.drawSpriteBatchYSorted(display, spriteManager.getLayer(SpriteManager.LAYER.MIDDLE), realTime, deltaTime);
    this.drawSpriteBatchYSorted(display, spriteManager.getLayer(SpriteManager.LAYER.TOP), realTime, deltaTime);
    this.drawSpriteBatchYSorted(display, spriteManager.getLayer(SpriteManager.LAYER.UI), realTime, deltaTime);
    this.drawLayer(tileManager, display, worldMap.getLayer(BattalionMap.LAYER.CLOUD));

    if(Renderer.DEBUG.MAP) {
        this.debugMap(context, worldMap);
    }
}

BattalionCamera.prototype.debugMap = function(context, worldMap) {
    const scaleX = Math.floor(this.tileWidth / 6);
    const scaleY = Math.floor(this.tileHeight / 6);
    const flagBuffer = worldMap.getLayer(BattalionMap.LAYER.FLAG).buffer;
    const teamBuffer = worldMap.getLayer(BattalionMap.LAYER.TEAM).buffer;
    const groundBuffer = worldMap.getLayer(BattalionMap.LAYER.GROUND).buffer;

    context.globalAlpha = 1;
    context.font = `${scaleX}px Arial`;
    context.textBaseline = "middle";
    context.textAlign = "left";

    this.drawTilesWithCallback((tileX, tileY, index, renderX, renderY) => {
        context.fillStyle = "#ff0000";
        context.fillText(flagBuffer[index], renderX + scaleX, renderY + scaleY);
        context.fillStyle = "#00ff00";
        context.fillText(teamBuffer[index], renderX + this.tileWidth - scaleX, renderY + scaleY);
        context.fillStyle = "#ffff00";
        context.fillText(groundBuffer[index], renderX + this.tileWidth - scaleX, renderY + this.tileHeight - scaleY);
        context.fillStyle = "#0000ff";
        context.fillText(`${tileX} | ${tileY}`, renderX + scaleX, renderY + this.tileHeight - scaleY);
    });

    this.drawMapOutlines(context);
}