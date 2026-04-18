import { Camera2D } from "../../engine/camera/camera2D.js";
import { TileOverlay } from "../../engine/camera/tileOverlay.js";
import { DEBUG } from "../../engine/debug.js";
import { EntityManager } from "../../engine/entity/entityManager.js";
import { SHAPE } from "../../engine/math/constants.js";
import { SpriteManager } from "../../engine/sprite/spriteManager.js";
import { drawShape, shadeScreen } from "../../engine/util/drawHelper.js";
import { TILE_HEIGHT, TILE_WIDTH } from "../../engine/engine_constants.js";
import { BattalionEntity } from "../entity/battalionEntity.js";
import { DIRECTION, LAYER_TYPE, PATH_FLAG, PLAYER_PREFERENCE, RANGE_TYPE, TILE_ID } from "../enums.js";
import { BattalionMap } from "../map/battalionMap.js";
import { EntityType } from "../type/parsed/entityType.js";
import { Mine } from "../entity/mine.js";
import { TeamManager } from "../team/teamManager.js";
import { TextureHandle } from "../../engine/resources/texture/textureHandle.js";
import { getHealthColor } from "../entity/helpers.js";
import { Autotiler } from "../../engine/tile/autotiler.js";
import { TextStyle } from "../../engine/graphics/textStyle.js";

const BLOCK = { COUNT: 4, WIDTH: 4, HEIGHT: 8, GAP: 1 };
const WIDTH = (BLOCK.GAP * (BLOCK.COUNT + 1)) + BLOCK.WIDTH * BLOCK.COUNT;
const HEIGHT = BLOCK.GAP * 2 + BLOCK.HEIGHT;
const OFFSET_X = TILE_WIDTH - 5 - WIDTH;
const OFFSET_Y = TILE_HEIGHT - 5 - HEIGHT;
const BACKGROUND_COLOR = "#000000";

//TODO(neyn): Increase the size if ever needed.
//Maybe do not let DEAD be a deferred state?
const MAX_DEFERRED = 64;

export const BattalionCamera = function() {
    Camera2D.call(this);

    //Maximum number of tiles a jammer can cover, using the Manhattan distance.
    const JAMMER_MAX_USED_TILES = 1 + 2 * EntityType.MAX_JAMMER_RANGE * (EntityType.MAX_JAMMER_RANGE + 1);

    //Each tile has a minCost of 1, which means there will NEVER be more than MAX_MOVE_COST tiles.
    this.pathOverlay = new TileOverlay(EntityType.MAX_MOVE_COST);
    this.jammerOverlay = new TileOverlay(JAMMER_MAX_USED_TILES);
    this.selectOverlay = new TileOverlay(1000);
    this.flags = BattalionCamera.FLAG.NONE;
    this.deferred = new Int32Array(MAX_DEFERRED);
    this.deferredCount = 0;
    this.inspectX = -1;
    this.inspectY = -1;

    this.teamID = TeamManager.INVALID_ID;
    this.isCurrentActor = false;
}

BattalionCamera.FLAG = {
    NONE: 0,
    SHOW_ALL_JAMMERS: 1 << 0,
    USE_PERSPECTIVES: 1 << 1
}

BattalionCamera.STEALTH_THRESHOLD = 0.5;

BattalionCamera.prototype = Object.create(Camera2D.prototype);
BattalionCamera.prototype.constructor = BattalionCamera;

BattalionCamera.prototype.setInspect = function(inspectX, inspectY) {
    this.inspectX = inspectX;
    this.inspectY = inspectY;
}

BattalionCamera.prototype.clearOverlays = function() {
    this.selectOverlay.clear();
    this.pathOverlay.clear();
    this.jammerOverlay.clear();
}

BattalionCamera.prototype.showEntityJammerAt = function(gameContext, entity, jammerX, jammerY) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const jammerRange = entity.config.jammerRange;

    this.jammerOverlay.clear();

    worldMap.fill2DGraph(jammerX, jammerY, jammerRange, (nextX, nextY) => {
        this.jammerOverlay.add(TILE_ID.JAMMER, nextX, nextY);
    });
}

BattalionCamera.prototype.showEntityNodes = function(gameContext, entity, nodeMap) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const rangeType = entity.getRangeType();
    const { tileX, tileY } = entity;
    const hasWeapon = entity.hasWeapon();
    const minRange = entity.config.minRange;
    const maxRange = entity.getMaxRange(gameContext);
    const isJammer = entity.isJammer();

    this.clearOverlays();

    switch(rangeType) {
        case RANGE_TYPE.MELEE: {
            for(const [index, node] of nodeMap) {
                const { x, y, flags } = node;

                if((flags & PATH_FLAG.UNREACHABLE) === 0) {
                    this.selectOverlay.add(TILE_ID.OVERLAY_MOVE, x, y);
                } else if(hasWeapon) {
                    this.selectOverlay.add(TILE_ID.OVERLAY_ATTACK_LIGHT, x, y);
                }
            }

            break;
        }
        case RANGE_TYPE.HYBRID:
        case RANGE_TYPE.RANGE: {
            for(const [index, node] of nodeMap) {
                const { x, y, flags } = node;
                const distance = entity.getDistanceToTile(x, y);

                //The node is reachable
                if((flags & PATH_FLAG.UNREACHABLE) === 0) {
                    if(distance >= minRange && distance <= maxRange) {
                        this.selectOverlay.add(TILE_ID.OVERLAY_MOVE_ATTACK, x, y);
                    } else {
                        this.selectOverlay.add(TILE_ID.OVERLAY_MOVE, x, y);
                    }
                } else {
                    //The node is unreachable, but still in attack range!
                    if(distance >= minRange && distance <= maxRange) {
                        this.selectOverlay.add(TILE_ID.OVERLAY_ATTACK_LIGHT, x, y);
                    } else {
                        //Not reachable and NOT in attack range.
                        //This node is invisible to the unit.
                    }
                }
            }

            //Fill the rest out to signal attack range.
            worldMap.fill2DGraph(tileX, tileY, maxRange, (nextX, nextY, distance, index) => {
                if(distance >= minRange && !nodeMap.has(index)) {
                    this.selectOverlay.add(TILE_ID.OVERLAY_ATTACK, nextX, nextY);
                }
            });

            break;
        }
    }

    if(isJammer) {
        this.showEntityJammerAt(gameContext, entity, tileX, tileY);
    }
}

BattalionCamera.prototype.showEntityPath = function(autotiler, path, entityX, entityY) {
    let previousX = entityX;
    let previousY = entityY;
    let nextX = -2;
    let nextY = -2;
    let tileID = 0;

    this.pathOverlay.clear();

    for(let i = path.length - 1; i >= 0; i--) {
        const { deltaX, deltaY } = path[i];
        const currentX = previousX + deltaX;
        const currentY = previousY + deltaY;
        
        if(i > 0) {
            nextX = currentX + path[i - 1].deltaX;
            nextY = currentY + path[i - 1].deltaY;
        } else {
            nextX = -2;
            nextY = -2;
        }

        tileID = autotiler.run(currentX, currentY, (x, y) => {
            if(previousX === x && previousY === y) {
                return Autotiler.RESPONSE.VALID;
            }

            if(nextX === x && nextY === y) {
                return Autotiler.RESPONSE.VALID;
            }

            return Autotiler.RESPONSE.INVALID;
        });

        previousX = currentX;
        previousY = currentY;

        this.pathOverlay.add(tileID, currentX, currentY);
    }

    //Put the starting node.
    if(path.length !== 0) {
        const { deltaX, deltaY } = path[path.length - 1];

        if(deltaX === 1) {
            tileID = TILE_ID.PATH_RIGHT;
        } else if(deltaX === -1) {
            tileID = TILE_ID.PATH_LEFT;
        } else if(deltaY === 1) {
            tileID = TILE_ID.PATH_DOWN;
        } else if(deltaY === -1) {
            tileID = TILE_ID.PATH_UP;
        }
    } else {
        tileID = TILE_ID.PATH_CENTER;
    }

    this.pathOverlay.add(tileID, entityX, entityY);
}

BattalionCamera.prototype.drawEntityHealth = function(display, drawX, drawY, vitality) {
    const { context } = display;
    const healthX = drawX + OFFSET_X;
    const healthY = drawY + OFFSET_Y;
    const healthColor = getHealthColor(vitality);

    context.fillStyle = BACKGROUND_COLOR;
    context.fillRect(healthX, healthY, WIDTH, HEIGHT);
    context.fillStyle = healthColor;

    const blockPixels = BLOCK.HEIGHT * BLOCK.COUNT;
    const filledPixels = Math.floor(blockPixels * vitality);
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

BattalionCamera.prototype.drawEntity = function(gameContext, display, entity, sprite, realTime, deltaTime) {
    const { teamManager, shadeCache, tileManager } = gameContext;
    const { tileX, tileY, offsetX, offsetY, state, teamID, flags, opacity, config, direction } = entity;
    const screenX = this.getScreenX(tileX) + offsetX;
    const screenY = this.getScreenY(tileY) + offsetY;
    let alpha = opacity;
    let hasActed = false;
    let isInactive = false;
    let marker = TILE_ID.NONE;

    if(flags & BattalionEntity.FLAG.HAS_ACTED) {
        hasActed = true;
    } else if((flags & BattalionEntity.FLAG.HAS_MOVED) && !(flags & BattalionEntity.FLAG.CAN_MOVE)) {
        hasActed = true;
    }

    if(this.flags & BattalionCamera.FLAG.USE_PERSPECTIVES) {
        if(opacity < BattalionCamera.STEALTH_THRESHOLD && (flags & BattalionEntity.FLAG.IS_CLOAKED) && teamManager.isAlly(teamID, this.teamID)) {
            alpha = BattalionCamera.STEALTH_THRESHOLD;
        }

        isInactive = (flags & BattalionEntity.FLAG.IS_TURN) && state === BattalionEntity.STATE.IDLE && hasActed;

        //Todo(neyn): This needs more options: Barricades NEVER have a marker for example as they cannot move!
        if(this.isCurrentActor && state === BattalionEntity.STATE.IDLE) {
            if(teamID === this.teamID) {
                if(!hasActed) {
                    marker = TILE_ID.MARKER;
                }
            } else {
                marker = TILE_ID.MARKER_WEAK;
            }
        }
    } else {
        if(opacity < BattalionCamera.STEALTH_THRESHOLD) {
            alpha = BattalionCamera.STEALTH_THRESHOLD;
        }
    }

    if(alpha > 0) {
        let vitality = entity.getVitality();

        if(vitality > 1) {
            vitality = 1;
        }

        sprite.setPosition(screenX, screenY);
        sprite.setOpacity(alpha);

        if(isInactive) {
            const shadeIndex = config.id * DIRECTION._COUNT + direction;
            const { state, bitmap, width, height } = shadeCache.getShade(shadeIndex);

            sprite.setFrame(0);
            sprite.draw(display, 0, 0);

            if(state === TextureHandle.STATE.LOADED) {
                const shadeX = screenX + sprite.offsetX;
                const shadeY = screenY + sprite.offsetY;

                display.context.drawImage(
                    bitmap,
                    0, 0, width, height,
                    shadeX, shadeY, width, height
                );
            }
        } else {
            sprite.update(realTime, deltaTime);
            sprite.draw(display, 0, 0);
        }

        if(PLAYER_PREFERENCE.FORCE_HEALTH_DRAW || vitality > 0 && vitality < 1) {
            this.drawEntityHealth(display, screenX, screenY, vitality);
        }

        if(marker !== TILE_ID.NONE) {
            display.setAlpha(1);

            this.drawTile(tileManager, marker, display.context, screenX, screenY);
        }

        if(flags & BattalionEntity.FLAG.IS_PROTECTED) {
            this.drawTile(tileManager, TILE_ID.MARKER_PROTECTED, display.context, screenX, screenY);
        }
    } else {
        if(DEBUG.SPRITES) {
            sprite.setPosition(screenX, screenY);
            sprite.debug(display, 0, 0);
        }
    }
}

BattalionCamera.prototype.drawEntities = function(gameContext, display, worldMap) {
    const { timer, world, spriteManager, tileManager } = gameContext;
    const { realTime, deltaTime } = timer;
    const { entityManager } = world;

    const movingEntities = worldMap.movingEntities;
    const mapEntities = worldMap.entities;
    const sprites = spriteManager.pool.elements;
    const renderStates = spriteManager.renderStates.elements;
    const containers = spriteManager.containers;
    const entities = entityManager.entities;

    const startX = this.startX;
    const startY = this.startY;
    const endX = this.endX;
    const endY = this.endY;
    const mapWidth = this.mapWidth;
    const currentFrame = this.currentFrame;
    let inspectedEntity = null;
    let count = 0;

    {
        const index = worldMap.getEntity(this.inspectX, this.inspectY);
        
        if(index !== EntityManager.INVALID_INDEX) {
            const entity = entities[index];
            const { spriteID } = entity;

            if(spriteID !== SpriteManager.INVALID_ID) {
                if(this.flags & BattalionCamera.FLAG.USE_PERSPECTIVES) {
                    if(entity.isVisibleTo(gameContext, this.teamID)) {
                        sprites[spriteID].lastFrame = currentFrame;
                        inspectedEntity = entity;
                    }
                } else {
                    sprites[spriteID].lastFrame = currentFrame;
                    inspectedEntity = entity;
                }
            }
        }
    }

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
                            this.drawEntity(gameContext, display, entity, sprite, realTime, deltaTime);
                        } else {
                            this.addDeferred(eIndex);
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
        const { tileX, tileY, spriteID } = entities[eIndex];

        if(spriteID !== SpriteManager.INVALID_ID) {   
            if(tileX >= startX && tileX <= endX && tileY >= startY && tileY <= endY) {
                const sprite = sprites[spriteID];

                if(sprite.lastFrame < currentFrame) {
                    sprite.lastFrame = currentFrame;
                    this.addDeferred(eIndex);
                    count++;
                }
            }
        }
    }

    for(let i = 0; i < this.deferredCount; i++) {
        const entity = entities[this.deferred[i]];
        const spriteID = entity.spriteID;

        this.drawEntity(gameContext, display, entity, sprites[spriteID], realTime, deltaTime);
    }

    if(inspectedEntity) {
        const { spriteID, tileX, tileY, cash } = inspectedEntity;

        this.drawEntity(gameContext, display, inspectedEntity, sprites[spriteID], realTime, deltaTime);

        if(cash !== 0) {
            const { context } = display;
            const screenX = this.tileXToScreen(tileX);
            const screenY = this.tileYToScreen(tileY);

            this.drawTile(tileManager, TILE_ID.CASH_BOX, display.context, screenX, screenY);

            context.textAlign = TextStyle.ALIGN.RIGHT;
            context.fillStyle = "#ffffff";
            context.globalAlpha = 1;
            context.fillText(cash, screenX + TILE_WIDTH - 4, screenY + 50);
            context.textAlign = TextStyle.ALIGN.LEFT;
        }

        count++;
    }

    this.deferredCount = 0;

    return count;
}

BattalionCamera.prototype.addDeferred = function(index) {
    if(this.deferredCount < MAX_DEFERRED) {
        this.deferred[this.deferredCount++] = index;
    }
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

BattalionCamera.prototype.drawMines = function(gameContext, display, worldMap) {
    const { tileManager } = gameContext;
    const { context } = display;
    const { mines } = worldMap;
    const length = mines.length;
    let count = 0;

    if(this.flags & BattalionCamera.FLAG.USE_PERSPECTIVES) {
        for(let i = 0; i < length; i++) {
            const mine = mines[i];
            const { tileX, tileY, opacity } = mine;
            let alpha = 1;
            
            if(opacity < BattalionCamera.STEALTH_THRESHOLD && mine.isVisibleTo(gameContext, this.teamID)) {
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
    const { world, tileManager, teamManager } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return;
    }

    let tiles = 0;
    let sprites = 0;
    let overlays = 0;
    let other = 0;

    this.isCurrentActor = teamManager.isCurrent(this.teamID);
    this.updateWorldBounds(worldMap.width, worldMap.height);
    tiles += this.drawLayer(tileManager, display, worldMap.getLayer(BattalionMap.LAYER.GROUND));
    tiles += this.drawLayer(tileManager, display, worldMap.getLayer(BattalionMap.LAYER.DECORATION));
    tiles += this.drawLayer(tileManager, display, worldMap.getLayer(BattalionMap.LAYER.CLOUD));
    overlays += this.drawOverlay(tileManager, display, this.selectOverlay);
    sprites += this.drawSpriteLayer(gameContext, display, LAYER_TYPE.BUILDING);
    other += this.drawMines(gameContext, display, worldMap);

    if(this.flags & BattalionCamera.FLAG.SHOW_ALL_JAMMERS) {
        other += this.drawJammers(tileManager, display, worldMap);
    } else {
        overlays += this.drawOverlay(tileManager, display, this.jammerOverlay);
    }

    overlays += this.drawOverlay(tileManager, display, this.pathOverlay);
    sprites += this.drawEntities(gameContext, display, worldMap);
    sprites += this.drawSortedSpriteLayer(gameContext, display, LAYER_TYPE.GFX);
    //this.shadeScreen(display, "#000000", 0.5);

    if(DEBUG.WORLD) {
        this.debugMap(display, worldMap);
        this.drawInfo(gameContext, display, tiles, sprites, overlays, other);
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

BattalionCamera.prototype.drawInfo = function(gameContext, display, tiles, sprites, overlays, other) {
    const { teamManager } = gameContext;
    const { round, turn } = teamManager;
    const { context } = display;
    
    drawShape(display, SHAPE.RECTANGLE, "#222222", 0, 0, 100, 30);

    context.fillStyle = "#467fc9";
    context.fillText(`Turn ${turn} | Round ${round}`, 0, 5);
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