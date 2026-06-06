import { Camera2D } from "../../engine/camera/camera2D.js";
import { TileOverlay } from "../../engine/renderer/tileOverlay.js";
import { SHAPE } from "../../engine/math/constants.js";
import { SpriteManager } from "../../engine/sprite/spriteManager.js";
import { drawShape, shadeScreen } from "../../engine/util/drawHelper.js";
import { TILE_HEIGHT, TILE_WIDTH } from "../../engine/engine_constants.js";
import { BattalionEntity } from "../entity/battalionEntity.js";
import { DIRECTION, LAYER_TYPE, MORALE_TYPE, PATH_FLAG, PLAYER_PREFERENCE, RANGE_TYPE, TILE_ID } from "../enums.js";
import { BattalionMap } from "../map/battalionMap.js";
import { EntityType } from "../type/parsed/entityType.js";
import { Mine } from "../entity/mine.js";
import { TeamManager } from "../team/teamManager.js";
import { ImageResource } from "../../engine/resources/texture/imageResource.js";
import { getHealthColor } from "../entity/helpers.js";
import { Autotiler } from "../../engine/tile/autotiler.js";
import { TextStyle } from "../../engine/graphics/textStyle.js";
import { Renderer2D } from "../../engine/renderer/renderer2D.js";
import { Display } from "../../engine/renderer/display.js";
import { WorldMap } from "../../engine/map/worldMap.js";
import { Sprite } from "../../engine/sprite/sprite.js";
import { Pathfinder } from "../map/pathfinder.js";
import { UI_TEXTURE } from "../ui/constants.js";

const BLOCK = { COUNT: 4, WIDTH: 4, HEIGHT: 8, GAP: 1 };
const WIDTH = (BLOCK.GAP * (BLOCK.COUNT + 1)) + BLOCK.WIDTH * BLOCK.COUNT;
const HEIGHT = BLOCK.GAP * 2 + BLOCK.HEIGHT;
const OFFSET_X = TILE_WIDTH - 5 - WIDTH;
const OFFSET_Y = TILE_HEIGHT - 5 - HEIGHT;
const BACKGROUND_COLOR = "#000000";

//TODO(neyn): Increase the size if ever needed.
//Maybe do not let DEAD be a deferred state?
const MAX_DEFERRED = 64;

export const BattalionRenderer2D = function() {
    Renderer2D.call(this);

    //Maximum number of tiles a jammer can cover, using the Manhattan distance.
    const JAMMER_MAX_USED_TILES = 1 + 2 * EntityType.MAX_JAMMER_RANGE * (EntityType.MAX_JAMMER_RANGE + 1);

    //Each tile has a minCost of 1, which means there will NEVER be more than MAX_MOVE_COST tiles.
    this.pathOverlay = new TileOverlay(EntityType.MAX_MOVE_COST);
    this.jammerOverlay = new TileOverlay(JAMMER_MAX_USED_TILES);
    this.flags = BattalionRenderer2D.FLAG.NONE;
    this.deferred = new Int32Array(MAX_DEFERRED);
    this.deferredCount = 0;
    this.inspectX = -1;
    this.inspectY = -1;

    this.teamID = TeamManager.INVALID_ID;
    this.isCurrentActor = false;
    this.pathfinderGeneration = 0;
}

BattalionRenderer2D.FLAG = {
    NONE: 0,
    SHOW_ALL_JAMMERS: 1 << 0,
    USE_PERSPECTIVES: 1 << 1
}

BattalionRenderer2D.STEALTH_THRESHOLD = 0.5;

BattalionRenderer2D.prototype = Object.create(Renderer2D.prototype);
BattalionRenderer2D.prototype.constructor = BattalionRenderer2D;

BattalionRenderer2D.prototype.setInspect = function(inspectX, inspectY) {
    this.inspectX = inspectX;
    this.inspectY = inspectY;
}

BattalionRenderer2D.prototype.clearOverlays = function() {
    this.pathOverlay.clear();
    this.jammerOverlay.clear();
}

BattalionRenderer2D.prototype.showEntityJammerAt = function(gameContext, entity, jammerX, jammerY) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const jammerRange = entity.config.jammerRange;

    this.jammerOverlay.clear();

    worldMap.fill2DGraph(jammerX, jammerY, jammerRange, (nextX, nextY) => {
        this.jammerOverlay.add(TILE_ID.JAMMER, nextX, nextY);
    });
}

/**
 * 
 * @param {*} gameContext 
 * @param {Pathfinder} pathfinder 
 * @returns 
 */
BattalionRenderer2D.prototype.drawMovementNodes = function(gameContext, camera, display, pathfinder) {
    const { tileManager } = gameContext;
    const { context } = display;
    const visitedNodes = pathfinder.visited;
    const generation = pathfinder.searchID;
    const tiles = pathfinder.tile;

    //Only spectate the given generation.
    if(generation !== this.pathfinderGeneration) {
        return 0;
    }

    const wTileX = camera.tileX;
    const wTileY = camera.tileY;
    const startX = camera.startX;
    const startY = camera.startY;
    const endX = camera.endX;
    const endY = camera.endY;
    const mapWidth = camera.mapWidth;
    const tileWidth = camera.tileWidth;
    const tileHeight = camera.tileHeight;
    const viewportX = camera.fOffsetX;
    const viewportY = camera.fOffsetY;

    let inspectedEntity = null;
    let entityCount = 0;
    let tileCount = 0;
    let renderY = (startY - wTileY) * tileHeight - viewportY;

    display.setAlpha(1);
    
    for(let i = startY; i <= endY; i++) {
        let index = i * mapWidth + startX;
        let renderX = (startX - wTileX) * tileWidth - viewportX;

        for(let j = startX; j <= endX; j++) {
            const tileID = tiles[index];

            //The node was visited by the latest search.
            if(visitedNodes[index] === generation && tileID !== 0) {
                this.drawTile(tileManager, tileID, context, renderX, renderY);
                tileCount++;
            }

            index++;
            renderX += tileWidth;
        }

        renderY += tileHeight;
    }

    return tileCount;
}

BattalionRenderer2D.prototype.showEntityPath = function(autotiler, path, entityX, entityY) {
    let previousX = entityX;
    let previousY = entityY;
    let nextX = -2;
    let nextY = -2;
    let tileID = 0;

    this.pathOverlay.clear();

    for(let i = 0; i < path.length; i++) {
        const { deltaX, deltaY } = path[i];
        const currentX = previousX + deltaX;
        const currentY = previousY + deltaY;

        if(i < path.length - 1) {
            nextX = currentX + path[i + 1].deltaX;
            nextY = currentY + path[i + 1].deltaY;
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
        const { deltaX, deltaY } = path[0];

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

BattalionRenderer2D.prototype.drawEntityHealth = function(display, drawX, drawY, vitality) {
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

/**
 * 
 * @param {*} gameContext 
 * @param {Camera2D} camera 
 * @param {Display} display 
 * @param {BattalionEntity} entity 
 * @param {Sprite} sprite 
 * @param {number} realTime 
 * @param {number} deltaTime 
 */
BattalionRenderer2D.prototype.drawEntity = function(gameContext, camera, display, entity, sprite, realTime, deltaTime) {
    const { teamManager, spriteController, tileManager } = gameContext;
    const { context } = display;
    const { tileX, tileY, offsetX, offsetY, teamID, renderFlags, opacity, config, direction } = entity;
    const screenX = camera.getScreenX(tileX) + offsetX;
    const screenY = camera.getScreenY(tileY) + offsetY;

    let alpha = opacity;
    let marker = TILE_ID.NONE;

    if(this.flags & BattalionRenderer2D.FLAG.USE_PERSPECTIVES) {
        //Is the entity visible to the viewer but below the alpha threshold.
        if(opacity < BattalionRenderer2D.STEALTH_THRESHOLD && (renderFlags & BattalionEntity.RENDER_FLAG.CLOAKED) && teamManager.isAlly(teamID, this.teamID)) {
            alpha = BattalionRenderer2D.STEALTH_THRESHOLD;
        }

        if(this.isCurrentActor && (renderFlags & BattalionEntity.RENDER_FLAG.MARKABLE)) {
            if(teamID === this.teamID) {
                if(!(renderFlags & BattalionEntity.RENDER_FLAG.ACTED)) {
                    marker = TILE_ID.MARKER;
                }
            } else {
                marker = TILE_ID.MARKER_WEAK;
            }
        }
    } else {
        if(opacity < BattalionRenderer2D.STEALTH_THRESHOLD) {
            alpha = BattalionRenderer2D.STEALTH_THRESHOLD;
        }
    }

    if(alpha > 0) {
        sprite.setPosition(screenX, screenY);
        sprite.setOpacity(alpha);

        //Draw the shaded frame over the sprite and lock the sprite to the first frame.
        if(renderFlags & BattalionEntity.RENDER_FLAG.SHADED) {
            const shadeIndex = config.id * DIRECTION._COUNT + direction;
            const { state, bitmap, width, height } = spriteController.getShade(shadeIndex);

            sprite.setFrame(0);
            sprite.draw(display, 0, 0);

            if(state === ImageResource.STATE.LOADED) {
                const shadeX = screenX + sprite.offsetX;
                const shadeY = screenY + sprite.offsetY;

                context.drawImage(
                    bitmap,
                    0, 0, width, height,
                    shadeX, shadeY, width, height
                );
            }
        } else {
            sprite.update(realTime, deltaTime);
            sprite.draw(display, 0, 0);
        }

        const vitality = entity.getVitalityCapped();
        
        if(PLAYER_PREFERENCE.FORCE_HEALTH_DRAW || vitality > 0 && vitality < 1) {
            this.drawEntityHealth(display, screenX, screenY, vitality);
        }

        if(marker !== TILE_ID.NONE) {
            display.setAlpha(1);

            this.drawTile(tileManager, marker, context, screenX, screenY);
        }

        if(renderFlags & BattalionEntity.RENDER_FLAG.PROTECTED) {
            this.drawTile(tileManager, TILE_ID.MARKER_PROTECTED, context, screenX, screenY);
        }
    } else {
        if(Renderer2D.DEBUG.SPRITES) {
            sprite.setPosition(screenX, screenY);
            sprite.debug(display, 0, 0);
        }
    }
}

/**
 * 
 * @param {*} gameContext 
 * @param {Camera2D} camera 
 * @param {Display} display 
 * @param {WorldMap} worldMap 
 * @returns 
 */
BattalionRenderer2D.prototype.drawEntities = function(gameContext, camera, display, worldMap) {
    const { timer, world, spriteManager, tileManager, uiData, spriteController } = gameContext;
    const { startX, startY, endX, endY, mapWidth } = camera;
    const { realTime, deltaTime } = timer;
    const { entityManager } = world;
    const { entities, hotEntities } = entityManager;
    const mapEntities = worldMap.entities;
    const sprites = spriteManager.pool.elements;
    const currentFrame = this.currentFrame;
    let inspectedEntity = null;
    let inspectedSpriteID = SpriteManager.INVALID_ID;
    let count = 0;

    {
        const index = worldMap.getEntity(this.inspectX, this.inspectY);
        const spriteID = spriteController.getEntitySpriteID(index);

        if(spriteID !== SpriteManager.INVALID_ID) {
            const entity = entities[index];

            if(this.flags & BattalionRenderer2D.FLAG.USE_PERSPECTIVES) {
                if(entity.isVisibleTo(gameContext, this.teamID)) {
                    sprites[spriteID].lastFrame = currentFrame;
                    inspectedEntity = entity;
                    inspectedSpriteID = spriteID;
                }
            } else {
                sprites[spriteID].lastFrame = currentFrame;
                inspectedEntity = entity;
                inspectedSpriteID = spriteID;
            }
        }
    }

    for(let i = startY; i <= endY; i++) {
        let index = i * mapWidth + startX;

        for(let j = startX; j <= endX; j++) {
            const eIndex = mapEntities[index];
            const spriteID = spriteController.getEntitySpriteID(eIndex);

            if(spriteID !== SpriteManager.INVALID_ID) {
                const sprite = sprites[spriteID];

                if(sprite.lastFrame < currentFrame) {
                    const entity = entities[eIndex];

                    if(entity.renderFlags & BattalionEntity.RENDER_FLAG.ACTING) {
                        this.addDeferred(eIndex);
                    } else {
                        this.drawEntity(gameContext, camera, display, entity, sprite, realTime, deltaTime);
                        count++;
                    }

                    sprite.lastFrame = currentFrame;
                }
            }

            index++;
        }
    }

    for(let i = 0; i < hotEntities.length; i++) {
        const eIndex = hotEntities[i];
        const spriteID = spriteController.getEntitySpriteID(eIndex);

        if(spriteID !== SpriteManager.INVALID_ID) {   
            const { tileX, tileY } = entities[eIndex];
    
            if(tileX >= startX && tileX <= endX && tileY >= startY && tileY <= endY) {
                const sprite = sprites[spriteID];

                if(sprite.lastFrame < currentFrame) {
                    this.addDeferred(eIndex);
                    sprite.lastFrame = currentFrame;
                }
            }
        }
    }

    for(let i = 0; i < this.deferredCount; i++) {
        const entityIndex = this.deferred[i];
        const spriteID = spriteController.getEntitySpriteID(entityIndex);

        this.drawEntity(gameContext, camera, display, entities[entityIndex], sprites[spriteID], realTime, deltaTime);
        count++;
    }

    if(inspectedEntity) {
        const { tileX, tileY, cash } = inspectedEntity;
        const moraleType = inspectedEntity.getMorale(gameContext);
        const screenX = camera.getScreenX(tileX);
        const screenY = camera.getScreenY(tileY);

        this.drawEntity(gameContext, camera, display, inspectedEntity, sprites[inspectedSpriteID], realTime, deltaTime);
        count++;

        if(cash !== 0) {
            const { context } = display;

            this.drawTile(tileManager, TILE_ID.CASH_BOX, context, screenX, screenY);

            context.textAlign = TextStyle.ALIGN.RIGHT;
            context.fillStyle = "#ffffff";
            context.globalAlpha = 1;
            context.fillText(cash, screenX + TILE_WIDTH - 4, screenY + 50);
            context.textAlign = TextStyle.ALIGN.LEFT;
        }

        if(moraleType.id !== MORALE_TYPE.NORMAL) {
            const moraleTexture = uiData.getTexture(UI_TEXTURE.MORALE_ICONS);
            const moraleX = screenX + TILE_WIDTH / 2 - 10;
            const moraleY = screenY - 10;

            moraleTexture.drawRegion(display, moraleType.icon, moraleX, moraleY);
        }
    }

    this.deferredCount = 0;

    return count;
}

BattalionRenderer2D.prototype.addDeferred = function(index) {
    if(this.deferredCount < MAX_DEFERRED) {
        this.deferred[this.deferredCount++] = index;
    }
}

BattalionRenderer2D.prototype.drawJammers = function(camera, tileManager, display, worldMap) {
    const { jammers } = worldMap;
    const { context } = display;
    let count = 0;

    for(const [index, field] of jammers) {
        const { tileX, tileY, blockers } = field;

        count += this.drawTileClipped(camera, tileManager, TILE_ID.JAMMER, context, tileX, tileY);
    }

    return count;
}

BattalionRenderer2D.prototype.drawMines = function(gameContext, camera, display, worldMap) {
    const { tileManager } = gameContext;
    const { context } = display;
    const { mines } = worldMap;
    const length = mines.length;
    let count = 0;

    if(this.flags & BattalionRenderer2D.FLAG.USE_PERSPECTIVES) {
        for(let i = 0; i < length; i++) {
            const mine = mines[i];
            const { tileX, tileY, opacity } = mine;
            let alpha = 1;
            
            if(opacity < BattalionRenderer2D.STEALTH_THRESHOLD && mine.isVisibleTo(gameContext, this.teamID)) {
                alpha = BattalionRenderer2D.STEALTH_THRESHOLD;
            } else {
                alpha = opacity;
            }

            if(alpha !== 0) {
                const tileID = mines[i].getTileSprite();
                
                display.setAlpha(alpha);

                count += this.drawTileClipped(camera, tileManager, tileID, context, tileX, tileY);
            }
        }
    } else {
        for(let i = 0; i < length; i++) {
            const { tileX, tileY, flags } = mines[i];
            const tileID = mines[i].getTileSprite();

            if(flags & Mine.FLAG.HIDDEN) {
                display.setAlpha(BattalionRenderer2D.STEALTH_THRESHOLD);
            } else {
                display.setAlpha(1);
            }

            count += this.drawTileClipped(camera, tileManager, tileID, context, tileX, tileY);
        }
    }

    return count;
}

/**
 * 
 * @param {*} gameContext 
 * @param {Camera2D} camera 
 * @param {Display} display 
 * @param {WorldMap} worldMap 
 * @returns 
 */
BattalionRenderer2D.prototype.drawTiles = function(gameContext, camera, display, worldMap) {
    const { tileManager } = gameContext;
    const { context } = display;
    const groundLayer = worldMap.getLayer(BattalionMap.LAYER.GROUND).buffer;
    const decoLayer = worldMap.getLayer(BattalionMap.LAYER.DECORATION).buffer;
    const cloudLayer = worldMap.getLayer(BattalionMap.LAYER.CLOUD).buffer;

    const wTileX = camera.tileX;
    const wTileY = camera.tileY;
    const startX = camera.startX;
    const startY = camera.startY;
    const endX = camera.endX;
    const endY = camera.endY;
    const mapWidth = camera.mapWidth;
    const tileWidth = camera.tileWidth;
    const tileHeight = camera.tileHeight;
    const viewportX = camera.fOffsetX;
    const viewportY = camera.fOffsetY;

    let tileCount = 0;
    let renderY = (startY - wTileY) * tileHeight - viewportY;

    display.setAlpha(1);
    
    for(let i = startY; i <= endY; i++) {
        let index = i * mapWidth + startX;
        let renderX = (startX - wTileX) * tileWidth - viewportX;

        for(let j = startX; j <= endX; j++) {
            const bottomID = groundLayer[index];
            const middleID = decoLayer[index];
            const topID = cloudLayer[index];

            if(bottomID !== 0) {
                this.drawTile(tileManager, bottomID, context, renderX, renderY);
                tileCount++;
            }

            if(middleID !== 0) {
                this.drawTile(tileManager, middleID, context, renderX, renderY);
                tileCount++;
            }

            if(topID !== 0) {
                this.drawTile(tileManager, topID, context, renderX, renderY);
                tileCount++;
            }

            index++;
            renderX += tileWidth;
        }

        renderY += tileHeight;
    }

    return tileCount;
}

BattalionRenderer2D.prototype.drawBuildings = function(gameContext, camera, display, buildings) {
    const { spriteManager, timer, spriteController } = gameContext;
    const { realTime, deltaTime } = timer;
    const sprites = spriteManager.pool.elements;
    const startX = camera.startX;
    const startY = camera.startY;
    const endX = camera.endX;
    const endY = camera.endY;

    let count = 0;

    for(let i = 0; i < buildings.length; i++) {
        const { tileX, tileY, index } = buildings[i];

        if(tileX >= startX && tileX <= endX && tileY >= startY && tileY <= endY) {
            const spriteID = spriteController.getBuildingSpriteID(i);

            if(spriteID !== SpriteManager.INVALID_ID) {
                const sprite = sprites[spriteID];
                const screenX = camera.getScreenX(tileX);
                const screenY = camera.getScreenY(tileY);

                sprite.setPosition(screenX, screenY);
                sprite.update(realTime, deltaTime);
                sprite.draw(display, 0, 0);
                count++;
            }
        }
    }

    return count;
}

BattalionRenderer2D.prototype.render = function(gameContext, camera, display) {
    const { client, world, tileManager, teamManager } = gameContext;
    const { session } = client;
    const { mapManager, actorManager } = world;
    const { round, turn } = teamManager;
    const { context } = display;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return;
    }

    let tiles = 0;
    let overlays = 0;
    let entities = 0;
    let buildings = 0;
    let gfx = 0;
    let total = 0;

    const actor = actorManager.getActor(session.actorID);

    if(actor) {
        this.isCurrentActor = teamManager.isCurrent(actor.teamID);
        this.teamID = actor.teamID;
    } else {
        this.isCurrentActor = false;
        this.teamID = TeamManager.INVALID_ID;
    }

    this.currentFrame++;
    
    camera.updateWorldBounds(worldMap.width, worldMap.height);
    
    tiles += this.drawTiles(gameContext, camera, display, worldMap);
    tiles += this.drawMovementNodes(gameContext, camera, display, worldMap.pathfinder);
    buildings += this.drawBuildings(gameContext, camera, display, worldMap.buildings);
    tiles += this.drawMines(gameContext, camera, display, worldMap);

    if(this.flags & BattalionRenderer2D.FLAG.SHOW_ALL_JAMMERS) {
        tiles += this.drawJammers(camera, tileManager, display, worldMap);
    } else {
        overlays += this.drawOverlay(camera, tileManager, display, this.jammerOverlay);
    }

    overlays += this.drawOverlay(camera, tileManager, display, this.pathOverlay);
    entities += this.drawEntities(gameContext, camera, display, worldMap);
    gfx += this.drawSortedSpriteLayer(gameContext, camera, display, LAYER_TYPE.GFX);
    total += tiles + overlays + entities + buildings + gfx;

    //this.shadeScreen(camera, display, "#000000", 0.5);

    if(Renderer2D.DEBUG.WORLD) {
        this.debugMap(camera, display, worldMap);
        
        drawShape(display, SHAPE.RECTANGLE, "#222222", 0, 0, 100, 40);

        context.fillStyle = "#467fc9";
        context.fillText(`Turn ${turn} | Round ${round}`, 0, 5);
        context.fillText(`Tiles ${tiles} | Overlays ${overlays}`, 0, 15);
        context.fillText(`Entities ${entities} | Buildings ${buildings}`, 0, 25);
        context.fillText(`GFX ${gfx} | Total ${total}`, 0, 35);  
    }
}

BattalionRenderer2D.prototype.shadeScreen = function(camera, display, color, alpha) {
    const { worldWidth, worldHeight } = camera;
    const { width, height } = display;
    let drawWidth = width;
    let drawHeight = height;

    if(worldWidth < drawWidth) {
        drawWidth = worldWidth;
    }

    if(worldHeight < drawHeight) {
        drawHeight = worldHeight;
    }

    shadeScreen(display, color, alpha, drawWidth, drawHeight);
}

BattalionRenderer2D.prototype.debugMap = function(camera, display, worldMap) {
    const { context } = display;
    const { tileWidth, tileHeight } = camera;
    const scaleX = Math.floor(tileWidth / 6);
    const scaleY = Math.floor(tileHeight / 6);

    context.globalAlpha = 1;
    context.font = `${scaleX}px Arial`;
    context.textBaseline = "middle";
    context.textAlign = "left";

    this.drawTilesWithCallback(camera, (tileX, tileY, index, renderX, renderY) => {
        context.fillStyle = "#0000ff";
        context.fillText(`${tileX} | ${tileY}`, renderX + scaleX, renderY + tileHeight - scaleY);
    });

    this.drawMapOutlines(camera, context);
}