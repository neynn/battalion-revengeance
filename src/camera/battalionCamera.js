import { Camera2D } from "../../engine/camera/camera2D.js";
import { Overlay } from "../../engine/camera/overlay.js";
import { Renderer } from "../../engine/renderer/renderer.js";
import { BattalionMap } from "../map/battalionMap.js";
import { TypeRegistry } from "../type/typeRegistry.js";

export const BattalionCamera = function() {
    Camera2D.call(this);

    this.selectOverlay = new Overlay();
    this.perspectives = new Set();
}

BattalionCamera.prototype = Object.create(Camera2D.prototype);
BattalionCamera.prototype.constructor = BattalionCamera;

BattalionCamera.prototype.addPerspective = function(teamID) {
    this.perspectives.add(teamID);
}

BattalionCamera.prototype.drawEntities = function(gameContext, display, realTime, deltaTime) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entities } = entityManager;
    const viewportLeftEdge = this.screenX;
    const viewportTopEdge = this.screenY;
    const viewportRightEdge = viewportLeftEdge + this.viewportWidth;
    const viewportBottomEdge = viewportTopEdge + this.viewportHeight

    for(let i = 0; i < entities.length; i++) {
        const { teamID, sprite, isCloaked } = entities[i];
        const isVisible = sprite.isVisible(viewportRightEdge, viewportLeftEdge, viewportBottomEdge, viewportTopEdge);

        if(!isVisible) {
            continue;
        }

        if(isCloaked && this.perspectives.has(teamID)) {
            const previousAlpha = sprite.getOpacity();

            if(previousAlpha < 0.5) {
                sprite.setOpacity(0.5);
                sprite.draw(display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime);
                sprite.setOpacity(previousAlpha);
                continue;
            }
        }

        sprite.draw(display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime);
    }
}

BattalionCamera.prototype.update = function(gameContext, display) {
    const { world, timer, spriteManager, tileManager } = gameContext;
    const { mapManager, entityManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return;
    }
    
    const { context } = display;
    const realTime = timer.getRealTime();
    const deltaTime = timer.getDeltaTime();

    this.updateWorldBounds();
    this.clampWorldBounds();
    this.floorRenderCoordinates();
    this.drawLayer(tileManager, display, worldMap.getLayer(BattalionMap.LAYER.GROUND));
    this.drawLayer(tileManager, display, worldMap.getLayer(BattalionMap.LAYER.DECORATION));
    this.drawLayer(tileManager, display, worldMap.getLayer(BattalionMap.LAYER.CLOUD));
    this.drawSpriteBatchYSorted(display, spriteManager.getLayer(TypeRegistry.LAYER_TYPE.BUILDING), realTime, deltaTime);
    this.drawOverlay(tileManager, context, this.selectOverlay);
    this.drawEntities(gameContext, display, realTime, deltaTime);

    //this.drawSpriteBatchYSorted(display, spriteManager.getLayer(TypeRegistry.LAYER_TYPE.SEA), realTime, deltaTime);
    //this.drawSpriteBatchYSorted(display, spriteManager.getLayer(TypeRegistry.LAYER_TYPE.LAND), realTime, deltaTime);

    if(Renderer.DEBUG.MAP) {
        this.debugMap(context, worldMap);
    }
}

BattalionCamera.prototype.drawBuildings = function(display, worldMap, realTime, deltaTime) {
    const { buildings } = worldMap;
    const length = buildings.length;

    for(let i = 0; i < length; i++) {
        const { sprite } = buildings[i];
        const { parent } = sprite;

        if(parent) {
            this.drawSprite(display, parent, realTime, deltaTime);
        }
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