import { Camera2D } from "../../engine/camera/camera2D.js";
import { TileOverlay } from "../../engine/camera/tileOverlay.js";
import { DEBUG } from "../../engine/debug.js";
import { EntityManager } from "../../engine/entity/entityManager.js";
import { SHAPE } from "../../engine/math/constants.js";
import { SpriteManager } from "../../engine/sprite/spriteManager.js";
import { drawShape, shadeScreen } from "../../engine/util/drawHelper.js";
import { TILE_HEIGHT, TILE_WIDTH } from "../../engine/engine_constants.js";
import { BattalionEntity } from "../entity/battalionEntity.js";
import { LAYER_TYPE, PLAYER_PREFERENCE, TILE_ID } from "../enums.js";
import { BattalionMap } from "../map/battalionMap.js";
import { EntityType } from "../type/parsed/entityType.js";
import { Mine } from "../entity/mine.js";
import { TeamManager } from "../team/teamManager.js";

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
    this.flags = BattalionCamera.FLAG.NONE;
    this.markerSprite = SpriteManager.EMPTY_SPRITE;
    this.weakMarkerSprite = SpriteManager.EMPTY_SPRITE;
    this.perspectives = new Set();
    this.mainPerspective = TeamManager.INVALID_ID;

    this.cashX = -1;
    this.cashY = -1;
    this.cashValue = 0;
}

BattalionCamera.FLAG = {
    NONE: 0,
    SHOW_ALL_JAMMERS: 1 << 0,
    USE_PERSPECTIVES: 1 << 1
}

BattalionCamera.STEALTH_THRESHOLD = 0.5;

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

    const blockPixels = BLOCK.HEIGHT * BLOCK.COUNT;
    const filledPixels = Math.floor(blockPixels * healthFactor);
    const fullBlocks = Math.floor(filledPixels / BLOCK.HEIGHT);
    const partialPixels = filledPixels % BLOCK.HEIGHT;

    let blockX = healthX + WIDTH;
    const blockY = healthY + BLOCK.GAP;
    const stepX = BLOCK.WIDTH + BLOCK.GAP;

    for(let i = 0; i < fullBlocks; i++) {
        blockX -= stepX;
        context.fillRect(blockX, blockY, BLOCK.WIDTH, BLOCK.HEIGHT);
    }

    if(partialPixels > 0) {
        blockX -= stepX;
        context.fillRect(blockX, blockY + (BLOCK.HEIGHT - partialPixels), BLOCK.WIDTH, partialPixels);
    }
}

BattalionCamera.prototype.drawEntityBlock = function(display, entity, sprite, screenX, screenY, alpha, realTime, deltaTime) {
    let healthFactor = entity.getHealthFactor();

    if(healthFactor > 1) {
        healthFactor = 1;
    }

    sprite.setPosition(screenX, screenY);
    sprite.setOpacity(alpha);
    sprite.update(realTime, deltaTime);
    sprite.draw(display, 0, 0);

    if(PLAYER_PREFERENCE.FORCE_HEALTH_DRAW || healthFactor > 0 && healthFactor < 1) {
        this.drawEntityHealth(display, screenX, screenY, healthFactor);
    }

    if(DEBUG.SPRITES) {
        sprite.debug(display, 0, 0);
    }
}

BattalionCamera.prototype.drawEntity = function(display, entity, sprite, realTime, deltaTime) {
    const { tileX, tileY, offsetX, offsetY, state, teamID, flags, opacity } = entity;
    const screenX = this.getScreenX(tileX) + offsetX;
    const screenY = this.getScreenY(tileY) + offsetY;
    let alpha = 1;

    if(this.flags & BattalionCamera.FLAG.USE_PERSPECTIVES) {
        if(opacity < BattalionCamera.STEALTH_THRESHOLD) {
            if((flags & BattalionEntity.FLAG.IS_CLOAKED) && this.perspectives.has(teamID)) {
                //Limit stealth opacity to STEALTH_THRESHOLD if perspectvies align.
                alpha = BattalionCamera.STEALTH_THRESHOLD;
            } else {
                //Fully hide entity.
                alpha = opacity;
            }
        } else {
            //Draw entity as usual.
            alpha = opacity;
        }

        this.drawEntityBlock(display, entity, sprite, screenX, screenY, alpha, realTime, deltaTime);

        if(state === BattalionEntity.STATE.IDLE && entity.canAct()) {
            display.setAlpha(1);

            if(teamID === this.mainPerspective) {
                this.markerSprite.onDraw(display, screenX, screenY);
            } else {
                this.weakMarkerSprite.onDraw(display, screenX, screenY);
            }
        }
    } else {
        if((flags & BattalionEntity.FLAG.IS_CLOAKED) && opacity < BattalionCamera.STEALTH_THRESHOLD) {
            alpha = BattalionCamera.STEALTH_THRESHOLD;
        } else {
            alpha = opacity;
        }

        this.drawEntityBlock(display, entity, sprite, screenX, screenY, alpha, realTime, deltaTime);
    }
}

BattalionCamera.prototype.drawEntities = function(gameContext, display, worldMap) {
    const { timer, world, spriteManager } = gameContext;
    const { realTime, deltaTime } = timer;
    const { entityManager } = world;

    const movingEntities = worldMap.movingEntities;
    const mapEntities = worldMap.entities;
    const sprites = spriteManager.pool.elements;
    const entities = entityManager.entities;

    const startX = this.startX;
    const startY = this.startY;
    const endX = this.endX;
    const endY = this.endY;
    const mapWidth = this.mapWidth;
    const currentFrame = this.currentFrame;
    const deferred = [];

    let count = 0;

    for(let i = startY; i <= endY; i++) {
        let index = i * mapWidth + startX;

        for(let j = startX; j <= endX; j++) {
            const eIndex = mapEntities[index];

            if(eIndex !== EntityManager.INVALID_INDEX) {
                const entity = entities[eIndex];
                const { spriteID, state } = entity;

                if(spriteID !== SpriteManager.INVALID_ID) {
                    const sprite = sprites[spriteID];

                    if(sprite.lastFrame < currentFrame) {
                        sprite.lastFrame = currentFrame;

                        if(state === BattalionEntity.STATE.IDLE) {
                            this.drawEntity(display, entity, sprite, realTime, deltaTime);
                        } else {
                            deferred.push(entity);
                        }

                        count++;
                    }
                }
            }

            index++;
        }
    }

    for(let i = 0; i < movingEntities.length; i++) {
        const eIndex = movingEntities[i];
        const entity = entities[eIndex];
        const { tileX, tileY, spriteID } = entity;

        if(spriteID !== SpriteManager.INVALID_ID) {   
            if(tileX >= startX && tileX <= endX && tileY >= startY && tileY <= endY) {
                const sprite = sprites[spriteID];

                if(sprite.lastFrame < currentFrame) {
                    sprite.lastFrame = currentFrame;
                    deferred.push(entity);
                    count++;
                }
            }
        }
    }

    /*
    for(let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const { tileX, tileY, spriteID, state } = entity;

        if(spriteID !== SpriteManager.INVALID_ID) {
            if(tileX >= startX && tileX <= endX && tileY >= startY && tileY <= endY) {
                const sprite = sprites[spriteID];

                //Prevents double-draw.
                if(sprite.lastFrame < this.currentFrame) {
                    if(state === BattalionEntity.STATE.IDLE) {
                        this.drawEntity(display, entity, sprite, realTime, deltaTime);
                    } else {
                        deferred.push(entity);
                    }

                    count++;
                }
            }
        }
    }
    */

    for(let i = 0; i < deferred.length; i++) {
        const entity = deferred[i];
        const spriteID = entity.spriteID;
        const sprite = sprites[spriteID];

        this.drawEntity(display, entity, sprite, realTime, deltaTime);
    }

    return count;
}

BattalionCamera.prototype.drawJammers = function(tileManager, display, worldMap) {
    const { jammers } = worldMap;
    const { context } = display;
    let count = 0;

    for(const [index, field] of jammers) {
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

    if(this.flags & BattalionCamera.FLAG.USE_PERSPECTIVES) {
        for(let i = 0; i < length; i++) {
            const { tileX, tileY, teamID, opacity } = mines[i];
            let alpha = 1;
            
            if(opacity < BattalionCamera.STEALTH_THRESHOLD && this.perspectives.has(teamID)) {
                alpha = BattalionCamera.STEALTH_THRESHOLD;
            } else {
                alpha = opacity;
            }

            if(alpha !== 0) {
                const tileID = mines[i].getTileSprite();
                
                display.setAlpha(alpha);

                count += this.drawTileClipped(tileManager, tileID, context, tileX, tileY);
            }
        }
    } else {
        for(let i = 0; i < length; i++) {
            const { tileX, tileY, state } = mines[i];
            const tileID = mines[i].getTileSprite();

            if(state === Mine.STATE.VISIBLE) {
                display.setAlpha(1);
            } else {
                display.setAlpha(BattalionCamera.STEALTH_THRESHOLD);
            }

            count += this.drawTileClipped(tileManager, tileID, context, tileX, tileY);
        }
    }

    return count;
}

BattalionCamera.prototype.update = function(gameContext, display) {
    const { world, tileManager } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return;
    }

    let tiles = 0;
    let sprites = 0;
    let overlays = 0;
    let other = 0;

    this.updateWorldBounds();
    tiles += this.drawLayer(tileManager, display, worldMap.getLayer(BattalionMap.LAYER.GROUND));
    tiles += this.drawLayer(tileManager, display, worldMap.getLayer(BattalionMap.LAYER.DECORATION));
    tiles += this.drawLayer(tileManager, display, worldMap.getLayer(BattalionMap.LAYER.CLOUD));
    overlays += this.drawOverlay(tileManager, display, this.selectOverlay);
    sprites += this.drawSpriteLayer(gameContext, display, LAYER_TYPE.BUILDING);
    other += this.drawMines(tileManager, display, worldMap);

    if(this.flags & BattalionCamera.FLAG.SHOW_ALL_JAMMERS) {
        other += this.drawJammers(tileManager, display, worldMap);
    } else {
        overlays += this.drawOverlay(tileManager, display, this.jammerOverlay);
    }

    overlays += this.drawOverlay(tileManager, display, this.pathOverlay);
    sprites += this.drawEntities(gameContext, display, worldMap);
    sprites += this.drawSortedSpriteLayer(gameContext, display, LAYER_TYPE.GFX);
    this.drawCash(display);
    //this.shadeScreen(display, "#000000", 0.5);

    if(DEBUG.WORLD) {
        this.debugMap(display, worldMap);
        this.drawInfo(gameContext, display, tiles, sprites, overlays, other);
    }

    this.currentFrame++;
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

BattalionCamera.prototype.drawInfo = function(gameContext, display, tiles, sprites, overlays, other) {
    const { world } = gameContext;
    const { turnManager } = world;
    const { globalRound, globalTurn } = turnManager;
    const { context } = display;
    
    drawShape(display, SHAPE.RECTANGLE, "#222222", 0, 0, 100, 30);

    context.fillStyle = "#467fc9";
    context.fillText(`Turn ${globalTurn} | Round ${globalRound}`, 0, 5);
    context.fillText(`Tiles ${tiles} | Sprites ${sprites}`, 0, 15);
    context.fillText(`Overlays ${overlays} | Other ${other}`, 0, 25);
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