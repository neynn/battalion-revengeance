import { Camera2D } from "../../engine/camera/camera2D.js";
import { Overlay } from "../../engine/camera/overlay.js";
import { Renderer } from "../../engine/renderer/renderer.js";
import { SpriteManager } from "../../engine/sprite/spriteManager.js";
import { BattalionEntity } from "../entity/battalionEntity.js";
import { BattalionMap } from "../map/battalionMap.js";
import { TypeRegistry } from "../type/typeRegistry.js";

export const BattalionCamera = function() {
    Camera2D.call(this);

    this.pathOverlay = new Overlay();
    this.selectOverlay = new Overlay();
    this.jammerOverlay = new Overlay();
    this.perspectives = new Set();
    this.mainPerspective = null;
    this.priorityEntities = [];
    this.regularEntities = [];
    this.markerSprite = SpriteManager.EMPTY_SPRITE;
    this.weakMarkerSprite = SpriteManager.EMPTY_SPRITE;
    this.showAllJammers = false;
}

BattalionCamera.prototype = Object.create(Camera2D.prototype);
BattalionCamera.prototype.constructor = BattalionCamera;

BattalionCamera.prototype.loadSprites = function(gameContext) {
    const { spriteManager } = gameContext;

    this.markerSprite = spriteManager.createSprite("marker");
}

BattalionCamera.prototype.addPerspective = function(teamID) {
    this.perspectives.add(teamID);
}

BattalionCamera.prototype.setMainPerspective = function(teamID) {
    this.mainPerspective = teamID;
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
        const { sprite, state } = entities[i];
        const isVisible = sprite.isVisible(viewportRightEdge, viewportLeftEdge, viewportBottomEdge, viewportTopEdge);

        if(isVisible) {
            if(state === BattalionEntity.STATE.IDLE) {
                this.regularEntities.push(entities[i]);
            } else {
                this.priorityEntities.push(entities[i]);
            }
        }
    }

    for(let i = 0; i < this.regularEntities.length; i++) {
        const entity = this.regularEntities[i];
        const { teamID, sprite } = entity;
        const { positionX, positionY } = sprite;

        if(entity.hasFlag(BattalionEntity.FLAG.IS_CLOAKED) && this.perspectives.has(teamID)) {
            sprite.drawCloaked(display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime);
        } else {
            sprite.drawNormal(display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime);
        }

        const markerX = positionX - viewportLeftEdge;
        const markerY = positionY - viewportTopEdge;

        if(teamID === this.mainPerspective) {
            if(entity.canAct() && this.markerSprite) {
                display.setAlpha(1);
                this.markerSprite.onDraw(display, markerX, markerY);
            }
        } else {
            if(this.weakMarkerSprite) {
                display.setAlpha(1);
                this.weakMarkerSprite.onDraw(display, markerX, markerY);
            }
        }
    }

    for(let i = 0; i < this.priorityEntities.length; i++) {
        const entity = this.priorityEntities[i];
        const { teamID, sprite } = entity;

        if(entity.hasFlag(BattalionEntity.FLAG.IS_CLOAKED) && this.perspectives.has(teamID)) {
            sprite.drawCloaked(display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime);
        } else {
            sprite.drawNormal(display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime);
        }
    }

    this.regularEntities.length = 0;
    this.priorityEntities.length = 0;
}

BattalionCamera.prototype.drawJammers = function(tileManager, context, worldMap) {
    const { jammerFields } = worldMap;

    for(const [index, field] of jammerFields) {
        const { tileX, tileY } = field;

        if(tileX >= this.startX && tileX <= this.endX && tileY >= this.startY && tileY <= this.endY) {
            const renderX = this.tileWidth * tileX;
            const renderY = this.tileHeight * tileY;

            this.drawTileSafe(tileManager, TypeRegistry.TILE_ID.JAMMER, context, renderX, renderY);
        }
    }
}

BattalionCamera.prototype.update = function(gameContext, display) {
    const { world, timer, spriteManager, tileManager } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return;
    }
    
    const { context } = display;
    const realTime = timer.getRealTime();
    const deltaTime = timer.getDeltaTime();

    this.updateWorldBounds();
    this.clampWorldBounds();
    this.drawLayer(tileManager, display, worldMap.getLayer(BattalionMap.LAYER.GROUND));
    this.drawLayer(tileManager, display, worldMap.getLayer(BattalionMap.LAYER.DECORATION));
    this.drawLayer(tileManager, display, worldMap.getLayer(BattalionMap.LAYER.CLOUD));
    this.drawOverlay(tileManager, context, this.selectOverlay);
    this.drawSpriteBatchYSorted(display, spriteManager.getLayer(TypeRegistry.LAYER_TYPE.BUILDING), realTime, deltaTime);

    if(this.showAllJammers) {
        this.drawJammers(tileManager, context, worldMap);
    } else {
        this.drawOverlay(tileManager, context, this.jammerOverlay);
    }

    this.drawOverlay(tileManager, context, this.pathOverlay);
    this.drawEntities(gameContext, display, realTime, deltaTime);
    this.drawSpriteBatchYSorted(display, spriteManager.getLayer(TypeRegistry.LAYER_TYPE.GFX), realTime, deltaTime);
    //this.drawSpriteBatchYSorted(display, spriteManager.getLayer(TypeRegistry.LAYER_TYPE.SEA), realTime, deltaTime);
    //this.drawSpriteBatchYSorted(display, spriteManager.getLayer(TypeRegistry.LAYER_TYPE.LAND), realTime, deltaTime);

    if(Renderer.DEBUG.MAP) {
        this.debugMap(context, worldMap);
    }
}

BattalionCamera.prototype.drawBuildings = function(display, worldMap, realTime, deltaTime) {
    const { buildings } = worldMap;
    const length = buildings.length;
    const viewportLeftEdge = this.screenX;
    const viewportTopEdge = this.screenY;
    const viewportRightEdge = viewportLeftEdge + this.viewportWidth;
    const viewportBottomEdge = viewportTopEdge + this.viewportHeight

    for(let i = 0; i < length; i++) {
        const { sprite } = buildings[i];
        const isVisible = sprite.isVisible(viewportRightEdge, viewportLeftEdge, viewportBottomEdge, viewportTopEdge);

        if(isVisible) {
            sprite.draw(display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime);
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