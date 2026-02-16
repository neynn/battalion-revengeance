import { Camera2D } from "../../engine/camera/camera2D.js";
import { TileOverlay } from "../../engine/camera/tileOverlay.js";
import { SHAPE } from "../../engine/math/constants.js";
import { Renderer } from "../../engine/renderer/renderer.js";
import { drawShape, shadeScreen } from "../../engine/util/drawHelper.js";
import { TILE_HEIGHT, TILE_WIDTH } from "../constants.js";
import { BattalionEntity } from "../entity/battalionEntity.js";
import { mineTypeToTile } from "../enumHelpers.js";
import { LAYER_TYPE, PLAYER_PREFERENCE, TILE_ID } from "../enums.js";
import { BattalionMap } from "../map/battalionMap.js";
import { EntityType } from "../type/parsed/entityType.js";

const BLOCK = { COUNT: 4, WIDTH: 4, HEIGHT: 8, GAP: 1 };
const WIDTH = (BLOCK.GAP * (BLOCK.COUNT + 1)) + BLOCK.WIDTH * BLOCK.COUNT;
const HEIGHT = BLOCK.GAP * 2 + BLOCK.HEIGHT;
const OFFSET_X = TILE_WIDTH - 5 - WIDTH;
const OFFSET_Y = TILE_HEIGHT - 5 - HEIGHT;
const BACKGROUND_COLOR = "#000000";
const DEFAULT_HEALTH_COLOR = "#ffffff";
const HEALTH_THRESHOLDS = [
    { "above": 0.75, "color": "#00ff00" },
    { "above": 0.5, "color": "#ffff00"},
    { "above": 0.25, "color": "#ff8800"},
    { "above": 0, "color": "#ff0000" }
];

export const BattalionCamera = function() {
    Camera2D.call(this);

    //Maximum number of tiles a jammer can cover, using the Manhattan distance.
    const JAMMER_MAX_USED_TILES = 1 + 2 * EntityType.MAX_JAMMER_RANGE * (EntityType.MAX_JAMMER_RANGE + 1);

    //Each tile has a minCost of 1, which means there will NEVER be more than MAX_MOVE_COST tiles.
    this.pathOverlay = new TileOverlay(EntityType.MAX_MOVE_COST);
    this.jammerOverlay = new TileOverlay(JAMMER_MAX_USED_TILES);
    this.selectOverlay = new TileOverlay(1000);
    this.showAllJammers = false;

    this.cashX = -1;
    this.cashY = -1;
    this.cashValue = 0;
}

BattalionCamera.STEALTH_THRESHOLD = 0.5;

BattalionCamera.prototype = Object.create(Camera2D.prototype);
BattalionCamera.prototype.constructor = BattalionCamera;

BattalionCamera.prototype.updateCash = function(tileX, tileY, cash) {
    if(this.cashX !== tileX || this.cashY !== tileY || this.cashValue !== cash) {
        this.cashX = tileX;
        this.cashY = tileY;
        this.cashValue = cash;
    }    
}

BattalionCamera.prototype.drawCash = function(display) {
    const { context } = display;

    //To avoid clutter, only non 0 cash is visualized
    if(this.cashValue !== 0) {
        const drawX = this.tileXToScreen(this.cashX);
        const drawY = this.tileYToScreen(this.cashY);

        context.fillStyle = "#ffffff";
        context.globalAlpha = 1;
        context.fillText(this.cashValue, drawX, drawY);
    }
}

BattalionCamera.prototype.drawEntityHealth = function(display, drawX, drawY, healthFactor) {
    const { context } = display;
    const healthX = drawX + OFFSET_X;
    const healthY = drawY + OFFSET_Y;
    let healthColor = DEFAULT_HEALTH_COLOR;

    for(let i = 0; i < HEALTH_THRESHOLDS.length; i++) {
        const { above, color } = HEALTH_THRESHOLDS[i];

        if(healthFactor >= above) {
            healthColor = color;
            break;
        }
    }

    context.fillStyle = BACKGROUND_COLOR;
    context.fillRect(healthX, healthY, WIDTH, HEIGHT);
    context.fillStyle = healthColor;

    let blockX = healthX + WIDTH;
    let blockY = healthY + BLOCK.GAP;
    let pixelFill = Math.floor((BLOCK.HEIGHT * BLOCK.COUNT) * healthFactor);

    while(pixelFill > 0) {
        blockX -= (BLOCK.WIDTH + BLOCK.GAP);
        pixelFill -= BLOCK.HEIGHT;

        if(pixelFill >= 0) {
            context.fillRect(blockX, blockY, BLOCK.WIDTH, BLOCK.HEIGHT);
        } else {
            context.fillRect(blockX, blockY - pixelFill, BLOCK.WIDTH, pixelFill + BLOCK.HEIGHT);
        }
    }
}

BattalionCamera.prototype.drawEntityBlock = function(display, entity, realTime, deltaTime) {
    const { view } = entity;
    const { visual, positionX, positionY } = view;
    const viewportX = this.fViewportX;
    const viewportY = this.fViewportY;
    let healthFactor = entity.getHealthFactor();

    if(healthFactor > 1) {
        healthFactor = 1;
    }

    visual.update(realTime, deltaTime);
    visual.draw(display, viewportX, viewportY);

    if(PLAYER_PREFERENCE.FORCE_HEALTH_DRAW || healthFactor > 0 && healthFactor < 1) {
        const healthX = positionX - viewportX;
        const healthY = positionY - viewportY;

        this.drawEntityHealth(display, healthX, healthY, healthFactor);
    }
}

BattalionCamera.prototype.drawEntity = function(display, entity, realTime, deltaTime) {
    const { view, flags } = entity;
    const { visual } = view;
    const opacity = visual.getOpacity();

    if((flags & BattalionEntity.FLAG.IS_CLOAKED) && opacity < BattalionCamera.STEALTH_THRESHOLD) {
        visual.setOpacity(BattalionCamera.STEALTH_THRESHOLD);
        this.drawEntityBlock(display, entity, realTime, deltaTime);
        visual.setOpacity(opacity);
    } else {
        this.drawEntityBlock(display, entity, realTime, deltaTime);
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
                this.drawEntity(display, entity, realTime, deltaTime);
            } else {
                priorityEntities.push(entity);
            }

            count++;
        }
    }

    for(let i = 0; i < priorityEntities.length; i++) {
        const entity = priorityEntities[i];

        this.drawEntity(display, entity, realTime, deltaTime);
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
            const { visual } = view;

            visual.update(realTime, deltaTime);
            visual.draw(display, viewportLeftEdge, viewportTopEdge);
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
    this.drawCash(display);
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