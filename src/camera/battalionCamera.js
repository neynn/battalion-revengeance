import { Camera2D } from "../../engine/camera/camera2D.js";
import { Overlay } from "../../engine/camera/overlay.js";
import { SHAPE } from "../../engine/math/constants.js";
import { Renderer } from "../../engine/renderer/renderer.js";
import { SpriteManager } from "../../engine/sprite/spriteManager.js";
import { drawShape, shadeScreen } from "../../engine/util/drawHelper.js";
import { BattalionEntity } from "../entity/battalionEntity.js";
import { LAYER_TYPE, TILE_ID } from "../enums.js";
import { BattalionMap } from "../map/battalionMap.js";

export const BattalionCamera = function() {
    Camera2D.call(this);

    this.pathOverlay = new Overlay();
    this.selectOverlay = new Overlay();
    this.jammerOverlay = new Overlay();
    this.perspectives = new Set();
    this.mainPerspective = null;
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
    const viewportLeftEdge = this.fViewportX;
    const viewportTopEdge = this.fViewportY;
    const viewportRightEdge = viewportLeftEdge + this.wViewportWidth;
    const viewportBottomEdge = viewportTopEdge + this.wViewportHeight;
    const priorityEntities = [];

    for(let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const { view, teamID, state } = entity;
        const isVisible = view.isVisible(viewportRightEdge, viewportLeftEdge, viewportBottomEdge, viewportTopEdge);

        if(!isVisible) {
            continue;
        }

        if(state !== BattalionEntity.STATE.IDLE) {
            priorityEntities.push(entities[i]);
            continue;
        }

        if(entity.hasFlag(BattalionEntity.FLAG.IS_CLOAKED) && this.perspectives.has(teamID)) {
            view.drawCloaked(display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime);
        } else {
            view.drawCloaked(display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime);
            //view.drawNormal(display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime);
        }

        const { positionX, positionY } = view;
        const markerX = positionX - viewportLeftEdge;
        const markerY = positionY - viewportTopEdge;

        if(teamID === this.mainPerspective) {
            if(entity.canAct()) {
                display.setAlpha(1);
                this.markerSprite.onDraw(display, markerX, markerY);
            }
        } else {
            display.setAlpha(1);
            this.weakMarkerSprite.onDraw(display, markerX, markerY);
        }
    }

    for(let i = 0; i < priorityEntities.length; i++) {
        const entity = priorityEntities[i];
        const { view, teamID } = entity;

        if(entity.hasFlag(BattalionEntity.FLAG.IS_CLOAKED) && this.perspectives.has(teamID)) {
            view.drawCloaked(display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime);
        } else {
            view.drawNormal(display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime);
        }
    }
}

BattalionCamera.prototype.drawJammers = function(tileManager, display, worldMap) {
    const { jammerFields } = worldMap;
    const { context } = display;

    for(const [index, field] of jammerFields) {
        const { tileX, tileY } = field;

        if(tileX >= this.startX && tileX <= this.endX && tileY >= this.startY && tileY <= this.endY) {
            const renderX = this.tileWidth * tileX;
            const renderY = this.tileHeight * tileY;

            this.drawTile(tileManager, TILE_ID.JAMMER, context, renderX, renderY);
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

    const realTime = timer.getRealTime();
    const deltaTime = timer.getDeltaTime();

    this.updateWorldBounds();
    this.drawLayer(tileManager, display, worldMap.getLayer(BattalionMap.LAYER.GROUND));
    this.drawLayer(tileManager, display, worldMap.getLayer(BattalionMap.LAYER.DECORATION));
    this.drawLayer(tileManager, display, worldMap.getLayer(BattalionMap.LAYER.CLOUD));
    this.drawOverlay(tileManager, display, this.selectOverlay);
    this.drawSpriteBatchYSorted(display, spriteManager.getLayer(LAYER_TYPE.BUILDING), realTime, deltaTime);

    if(this.showAllJammers) {
        this.drawJammers(tileManager, display, worldMap);
    } else {
        this.drawOverlay(tileManager, display, this.jammerOverlay);
    }

    this.drawOverlay(tileManager, display, this.pathOverlay);
    this.drawEntities(gameContext, display, realTime, deltaTime);
    this.drawSpriteBatchYSorted(display, spriteManager.getLayer(LAYER_TYPE.GFX), realTime, deltaTime);
    //this.drawSpriteBatchYSorted(display, spriteManager.getLayer(LAYER_TYPE.SEA), realTime, deltaTime);
    //this.drawSpriteBatchYSorted(display, spriteManager.getLayer(LAYER_TYPE.LAND), realTime, deltaTime);
    //this.shadeScreen(display, "#000000", 0.5);

    if(Renderer.DEBUG.MAP) {
        this.debugMap(display, worldMap);
        this.drawInfo(gameContext, display);
    }
}

BattalionCamera.prototype.shadeScreen = function(display, color, alpha) {
    const { width, height } = display;
    let drawWidth = width;
    let drawHeight = height;

    if(this.worldWidth < drawWidth) {
        drawWidth = this.worldWidth;
    }

    if(this.worldHeight < drawHeight) {
        drawHeight = this.worldHeight;
    }

    shadeScreen(display, color, alpha, drawWidth, drawHeight);
}

BattalionCamera.prototype.drawInfo = function(gameContext, display) {
    const { world } = gameContext;
    const { turnManager } = world;
    const { currentRound, currentTurn } = turnManager;
    const { context } = display;
    
    drawShape(display, SHAPE.RECTANGLE, "#222222", 0, 0, 100, 30);

    context.fillStyle = "#ff0000";
    context.fillText(`Turn ${currentTurn} | Round ${currentRound}`, 0, 10);
}

BattalionCamera.prototype.drawBuildings = function(display, worldMap, realTime, deltaTime) {
    const { buildings } = worldMap;
    const length = buildings.length;
    const viewportLeftEdge = this.fViewportX;
    const viewportTopEdge = this.fViewportY;
    const viewportRightEdge = viewportLeftEdge + this.wViewportWidth;
    const viewportBottomEdge = viewportTopEdge + this.wViewportHeight

    for(let i = 0; i < length; i++) {
        const { view } = buildings[i];
        const isVisible = view.isVisible(viewportRightEdge, viewportLeftEdge, viewportBottomEdge, viewportTopEdge);

        if(isVisible) {
            view.draw(display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime);
        }
    }
}

BattalionCamera.prototype.debugMap = function(display, worldMap) {
    const { context } = display;
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