import { Camera2D } from "../../engine/camera/camera2D.js";
import { Overlay } from "../../engine/camera/overlay.js";
import { SHAPE } from "../../engine/math/constants.js";
import { Renderer } from "../../engine/renderer/renderer.js";
import { drawShape, shadeScreen } from "../../engine/util/drawHelper.js";
import { BattalionEntity } from "../entity/battalionEntity.js";
import { mineTypeToTile } from "../enumHelpers.js";
import { LAYER_TYPE, TILE_ID } from "../enums.js";
import { BattalionMap } from "../map/battalionMap.js";

export const BattalionCamera = function() {
    Camera2D.call(this);

    this.pathOverlay = new Overlay();
    this.selectOverlay = new Overlay();
    this.jammerOverlay = new Overlay();
    this.showAllJammers = false;
}

BattalionCamera.STEALTH_THRESHOLD = 0.5;

BattalionCamera.prototype = Object.create(Camera2D.prototype);
BattalionCamera.prototype.constructor = BattalionCamera;

BattalionCamera.prototype.drawEntity = function(entity, display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime) {
    const { view, flags } = entity;
    const { visual } = view;
    const opacity = visual.getOpacity();

    if((flags & BattalionEntity.FLAG.IS_CLOAKED) && opacity < BattalionCamera.STEALTH_THRESHOLD) {
        visual.setOpacity(BattalionCamera.STEALTH_THRESHOLD);
        view.draw(display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime);
        visual.setOpacity(opacity);
    } else {
        view.draw(display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime);
    }
}

BattalionCamera.prototype.debugEntities = function(gameContext, display) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entities } = entityManager;
    const viewportLeftEdge = this.fViewportX;
    const viewportTopEdge = this.fViewportY;
    const viewportRightEdge = viewportLeftEdge + this.wViewportWidth;
    const viewportBottomEdge = viewportTopEdge + this.wViewportHeight;

    display.setAlpha(1);

    for(let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const { view } = entity;
        const { visual } = view;
        const isVisible = view.isVisible(viewportRightEdge, viewportLeftEdge, viewportBottomEdge, viewportTopEdge);

        if(isVisible) {
            visual.debug(display, viewportLeftEdge, viewportTopEdge);
        }
    }
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
    let count = 0;

    for(let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const { view, state } = entity;
        const isVisible = view.isVisible(viewportRightEdge, viewportLeftEdge, viewportBottomEdge, viewportTopEdge);

        if(isVisible) {
            if(state === BattalionEntity.STATE.IDLE) {
                this.drawEntity(entity, display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime);
            } else {
                priorityEntities.push(entity);
            }

            count++;
        }
    }

    for(let i = 0; i < priorityEntities.length; i++) {
        const entity = priorityEntities[i];

        this.drawEntity(entity, display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime);
    }

    if(Renderer.DEBUG.SPRITES) {
        this.debugEntities(gameContext, display);
    }

    return count;
}

BattalionCamera.prototype.drawJammers = function(tileManager, display, worldMap) {
    const { jammerFields } = worldMap;
    const { context } = display;
    let count = 0;

    for(const [index, field] of jammerFields) {
        const { tileX, tileY } = field;

        count += this.drawTileClipped(tileManager, TILE_ID.JAMMER, context, tileX, tileY);
    }

    return count;
}

BattalionCamera.prototype.drawMines = function(tileManager, display, worldMap) {
    const { context } = display;
    const { mines } = worldMap;
    const length = mines.length;
    let count = 0;

    for(let i = 0; i < length; i++) {
        const { tileX, tileY, type } = mines[i];
        const tileID = mineTypeToTile(type);

        count += this.drawTileClipped(tileManager, tileID, context, tileX, tileY);
    }

    return count;
}

BattalionCamera.prototype.drawBuildings = function(display, worldMap, realTime, deltaTime) {
    const { buildings } = worldMap;
    const length = buildings.length;
    const viewportLeftEdge = this.fViewportX;
    const viewportTopEdge = this.fViewportY;
    const viewportRightEdge = viewportLeftEdge + this.wViewportWidth;
    const viewportBottomEdge = viewportTopEdge + this.wViewportHeight
    let count = 0;

    for(let i = 0; i < length; i++) {
        const { view } = buildings[i];
        const isVisible = view.isVisible(viewportRightEdge, viewportLeftEdge, viewportBottomEdge, viewportTopEdge);

        if(isVisible) {
            view.draw(display, viewportLeftEdge, viewportTopEdge, realTime, deltaTime);
            count++;
        }
    }

    return count;
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
    this.drawMines(tileManager, display, worldMap);

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