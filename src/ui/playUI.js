import { EntityManager } from "../../engine/entity/entityManager.js";
import { TextStyle } from "../../engine/graphics/textStyle.js";
import { WorldMap } from "../../engine/map/worldMap.js";
import { clampValue, isRectangleRectangleIntersect } from "../../engine/math/math.js";
import { TextureRegistry } from "../../engine/resources/texture/textureRegistry.js";
import { SpriteManager } from "../../engine/sprite/spriteManager.js";
import { UIContext } from "../../engine/ui/uiContext.js";
import { MapInspector } from "../actors/player/inspector.js";
import { getHealthColor } from "../entity/helpers.js";
import { TILE_ID } from "../enums.js";
import { BattalionMap } from "../map/battalionMap.js";

const TILE_DRAW_ORDER = [
    BattalionMap.LAYER.GROUND,
    BattalionMap.LAYER.DECORATION,
    BattalionMap.LAYER.CLOUD
];

const TEXTURE_ID = {
    RECON_UNIT: 0,
    RECON_TERRAIN: 1,
    RECON_NONE: 2,
    RECON_MAIN: 3,
    ICONS: 4,
    RECON_HEALTH: 5,
    _COUNT: 6
};

const TEXTURES = new Int16Array(TEXTURE_ID._COUNT);

for(let i = 0; i < TEXTURE_ID._COUNT; i++) {
    TEXTURES[i] = TextureRegistry.INVALID_ID
}

export const PlayUI = function(inspector, cContext, gameContext) {
    UIContext.call(this);

    this.inspector = inspector;
    this.cContext = cContext;
    this.gameContext = gameContext;
    this.inspectSprite = SpriteManager.EMPTY_SPRITE;
    this.style = new TextStyle();

    this.style.baseline = TextStyle.TEXT_BASELINE.TOP;
    this.style.font = "10px arial";
    this.lines = [];
    this.lineTime = 0;

    this.lastInspect = MapInspector.STATE.NONE;
    this.lastIndex = -1;
}

PlayUI.prototype = Object.create(UIContext.prototype);
PlayUI.prototype.constructor = PlayUI;

PlayUI.prototype.load = function(gameContext) {
    const { uiManager, spriteManager, textureLoader } = gameContext;
    
    TEXTURES[TEXTURE_ID.RECON_UNIT] = uiManager.getTextureID("recon_unit");
    TEXTURES[TEXTURE_ID.RECON_TERRAIN] = uiManager.getTextureID("recon_terrain");
    TEXTURES[TEXTURE_ID.RECON_NONE] = uiManager.getTextureID("recon_none");
    TEXTURES[TEXTURE_ID.RECON_MAIN] = uiManager.getTextureID("recon_mainframe");
    TEXTURES[TEXTURE_ID.ICONS] = uiManager.getTextureID("icons");
    TEXTURES[TEXTURE_ID.RECON_HEALTH] = uiManager.getTextureID("recon_health");

    this.inspectSprite = spriteManager.createEmptySprite();
    this.inspectSprite.scale = 0.6;

    for(let i = 0; i < TEXTURE_ID._COUNT; i++) {
        textureLoader.loadTexture(TEXTURES[i]);
    }

    uiManager.addContext(this);
}

PlayUI.prototype.regenerateLines = function(context, text, maxWidth) {
    this.lines.length = 0;
    this.lineTime = 0;

    const words = text.split(' ');
    let line = '';

    for(let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;
        
        if(testWidth > maxWidth && line !== '') {
            this.lines.push(line.trim());
            line = words[i] + ' ';
        } else {
            line = testLine;
        }
    }

    if(line) {
        this.lines.push(line.trim());
    }
}

//TODO(neyn): Create a 28x28 ICON for each entity!
//This icon gets drawn instead of a full sprite!
PlayUI.prototype.updateInspectSprite = function(entity) {
    const { spriteManager } = this.gameContext;
    const team = entity.getTeam(this.gameContext);

    spriteManager.updateSprite(this.inspectSprite.index, entity.config.sprites.idle_right, team.schema.id);
}

PlayUI.prototype.updateBuilding = function(building) {
    const { spriteManager } = this.gameContext;

    spriteManager.updateSprite(this.inspectSprite.index, building.config.sprite, building.color);
}

PlayUI.prototype.drawTile = function(display, tileX, tileY, screenX, screenY) {
    const { tileManager, world } = this.gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const { context } = display;

    for(const layerID of TILE_DRAW_ORDER) {
        const tileID = worldMap.getTile(layerID, tileX, tileY);

        if(tileID > TILE_ID.NONE) {
            this.cContext.camera.drawTile(tileManager, tileID, context, screenX + 4, screenY + 11, 0.5);
        }
    }
}

const RECON_VITALITY_HEALTH_WIDTH = 33;
const RECON_VITALITY_HEALTH_HEIGHT = 6;
const DESCRIPTION_BOX_WIDTH_TILE_VANILLA = 421;
const DESCRIPTION_BOX_WIDTH_TILE = 381;
const DESCRIPTION_BOX_WIDTH_ENTITY = 215;
const ICON_WIDTH = 20;
const ICON_HEIGHT = 20;

PlayUI.prototype.doIcon = function(iconID, display, screenX, screenY) {
    const { client, textureLoader } = this.gameContext;
    const { cursor } = client;
    const { positionX, positionY, radius } = cursor;

    //TODO return is collided 
    textureLoader.getTextureWithFallback(TEXTURES[TEXTURE_ID.ICONS]).drawRegion(iconID, display, screenX, screenY);

    return isRectangleRectangleIntersect(
        positionX, positionY, radius, radius,
        screenX, screenY, ICON_WIDTH, ICON_HEIGHT
    );
}

PlayUI.prototype.onDraw = function(display, screenX, screenY) {
    const { world, language, timer, textureLoader, typeRegistry } = this.gameContext;
    const { mapManager } = world;
    const { realTime, deltaTime } = timer;
    const { context } = display;

    const drawX = this.cContext.positionX + this.cContext.camera.viewportWidth;
    const drawY = this.cContext.positionY + this.cContext.camera.viewportHeight;
    const tileX = this.inspector.lastX;
    const tileY = this.inspector.lastY;
    const beginX = drawX - 565;
    const traitX = beginX + 476;
    const headY = drawY + 4;
    const bodyY = drawY + 20;
    const worldMap = mapManager.getActiveMap();
    const index = worldMap.getIndex(tileX, tileY);

    if(this.lastInspect !== this.inspector.state) {
        this.lastIndex = -1;
        this.lastInspect = this.inspector.state;
        this.lines.length = 0;
    }

    this.style.apply(context);

    switch(this.lastInspect) {
        case MapInspector.STATE.NONE: {
            textureLoader.getTextureWithFallback(TEXTURES[TEXTURE_ID.RECON_NONE]).draw(display, beginX, drawY);
            break;
        }
        case MapInspector.STATE.TILE: {
            const { terrain } = worldMap.getTileType(this.gameContext, tileX, tileY);
            const climateType = worldMap.getClimateType(this.gameContext, tileX, tileY);
            const climateX = beginX + 439;

            textureLoader.getTextureWithFallback(TEXTURES[TEXTURE_ID.RECON_TERRAIN]).draw(display, beginX, drawY);

            this.drawTile(display, tileX, tileY, beginX, drawY);
            this.style.apply(context);

            context.fillText(worldMap.getTileName(this.gameContext, tileX, tileY), beginX + 41, headY);
            context.fillText(language.getSystemTranslation("RECON_TRAIT"), traitX + 2, headY);

            if(this.lastIndex !== index) {
                this.regenerateLines(context, worldMap.getTileDesc(this.gameContext, tileX, tileY), DESCRIPTION_BOX_WIDTH_TILE);
                this.lastIndex = index;
            }

            //INFO: Climate has no text!
            if(this.doIcon(climateType.icon, display, climateX, bodyY)) {
                //TODO(neyn): draw infobox
            }

            for(let i = 0; i < terrain.length; i++) {
                const { icon } = typeRegistry.getTerrainType(terrain[i]);

                this.doIcon(icon, display, traitX + (ICON_WIDTH + 1) * i, bodyY);
            }

            break;
        }
        case MapInspector.STATE.BUILDING: {
            const building = worldMap.getBuilding(tileX, tileY);

            if(this.lastIndex !== index) {
                this.regenerateLines(context, building.getDescription(this.gameContext), DESCRIPTION_BOX_WIDTH_TILE);
                this.updateBuilding(building);
                this.lastIndex = index;
            }

            textureLoader.getTextureWithFallback(TEXTURES[TEXTURE_ID.RECON_TERRAIN]).draw(display, beginX, drawY);

            this.drawTile(display, tileX, tileY, beginX, drawY);
            this.inspectSprite.onUpdate(realTime, deltaTime);
            this.inspectSprite.onDraw(display, beginX + 1, drawY + 5);

            context.fillText(building.getName(this.gameContext), beginX + 41, headY);
            context.fillText(language.getSystemTranslation("RECON_TRAIT"), traitX + 2, headY);

            for(let i = 0; i < building.config.traits.length; i++) {
                const { icon } = typeRegistry.getTraitType(building.config.traits[i]);

                this.doIcon(icon, display, traitX + (ICON_WIDTH + 1) * i, bodyY);
            }

            break;
        }
        case MapInspector.STATE.ENTITY: {
            const entity = world.getEntityAt(tileX, tileY);

            if(this.lastIndex !== index) {
                this.regenerateLines(context, entity.getDescription(this.gameContext), DESCRIPTION_BOX_WIDTH_ENTITY);
                this.updateInspectSprite(entity);
                this.lastIndex = index;
            }

            textureLoader.getTextureWithFallback(TEXTURES[TEXTURE_ID.RECON_UNIT]).draw(display, beginX, drawY);

            this.drawTile(display, tileX, tileY, beginX, drawY);
            this.inspectSprite.onUpdate(realTime, deltaTime);
            this.inspectSprite.onDraw(display, beginX + 1, drawY + 5);

            const armorX = beginX + 273;
            const weaponX = beginX + 351;
            const moveX = beginX + 429;
            const minRange = entity.config.minRange;
            const maxRange = entity.getMaxRange(this.gameContext);
            const armorType = typeRegistry.getArmorType(entity.config.armorType);
            const movementType = typeRegistry.getMovementType(entity.config.movementType);
            const weaponType = typeRegistry.getWeaponType(entity.config.weaponType);
            const vitality = clampValue(entity.getVitality(), 1, 0);
            const healthColor = getHealthColor(vitality);

            context.fillText(entity.getName(this.gameContext), beginX + 41, headY);
            context.fillText(language.getSystemTranslation("RECON_HEALTH"), armorX, headY);
            context.fillText(language.getSystemTranslation("RECON_DAMAGE"), weaponX, headY);
            context.fillText(language.getSystemTranslation("RECON_MOVE"), moveX, headY);
            context.fillText(language.getSystemTranslation("RECON_TRAIT"), traitX + 2, headY);

            context.fillStyle = healthColor;
            context.fillRect(armorX + ICON_WIDTH + 5, bodyY, Math.floor(vitality * RECON_VITALITY_HEALTH_WIDTH), RECON_VITALITY_HEALTH_HEIGHT);
            context.fillStyle = "#ffffff";

            this.doIcon(armorType.icon, display, armorX, bodyY);
            context.fillText(`${entity.health}/${entity.maxHealth}`, armorX + ICON_WIDTH + 2, bodyY + 10);
            textureLoader.getTextureWithFallback(TEXTURES[TEXTURE_ID.RECON_HEALTH]).draw(display, armorX + ICON_WIDTH + 2, bodyY);

            this.doIcon(weaponType.icon, display, weaponX, bodyY);
            context.fillText(`${entity.damage}`, weaponX + ICON_WIDTH + 2, bodyY + 10);

            if(maxRange > 1) {
                context.fillText(`[${minRange}-${maxRange}]`, weaponX + ICON_WIDTH + 2 + 15, bodyY + 10);
            }

            this.doIcon(movementType.icon, display, moveX, bodyY);
            context.fillText(`${entity.config.movementRange}`, moveX + ICON_WIDTH + 2, bodyY + 10);

            for(let i = 0; i < entity.config.traits.length; i++) {
                const { icon } = typeRegistry.getTraitType(entity.config.traits[i]);

                this.doIcon(icon, display, traitX + (ICON_WIDTH + 1) * i, bodyY);
            }

            break;
        }
    }

    context.fillStyle = "#ffffff";
    
    switch(this.lines.length) {
        case 0: {
            break;
        }
        case 1: {
            context.fillText(this.lines[0], beginX + 39, bodyY);
            break;
        }
        case 2: {
            context.fillText(this.lines[0], beginX + 39, bodyY);
            context.fillText(this.lines[1], beginX + 39, bodyY + 10);
            break;
        }
        default: {
            const SECONDS_PER_LINE = 2;
            const frameIndex = Math.floor(this.lineTime / SECONDS_PER_LINE) % this.lines.length;

            context.fillText(this.lines[frameIndex], beginX + 39, bodyY);

            if(frameIndex < this.lines.length - 1) {
                context.fillText(this.lines[frameIndex + 1], beginX + 39, bodyY + 10);
            }

            this.lineTime += this.gameContext.timer.deltaTime;
            break;
        }
    }

    textureLoader.getTextureWithFallback(TEXTURES[TEXTURE_ID.RECON_MAIN]).draw(display, drawX - 16, this.cContext.positionY);
}