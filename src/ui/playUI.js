import { EntityManager } from "../../engine/entity/entityManager.js";
import { TextStyle } from "../../engine/graphics/textStyle.js";
import { TextureRegistry } from "../../engine/resources/texture/textureRegistry.js";
import { SpriteManager } from "../../engine/sprite/spriteManager.js";
import { UIContext } from "../../engine/ui/uiContext.js";
import { MapInspector } from "../actors/player/inspector.js";
import { RANGE_TYPE, TILE_ID } from "../enums.js";
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
    _COUNT: 4
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
    this.entitySprite = SpriteManager.EMPTY_SPRITE;
    this.style = new TextStyle();

    this.style.baseline = TextStyle.TEXT_BASELINE.TOP;
    this.style.font = "10px arial";
    this.lastEntity = EntityManager.INVALID_ID;
    this.lines = [];
    this.lineTime = 0;
}

PlayUI.prototype = Object.create(UIContext.prototype);
PlayUI.prototype.constructor = PlayUI;

PlayUI.prototype.load = function(gameContext) {
    const { uiManager, spriteManager, textureLoader } = gameContext;
    
    TEXTURES[TEXTURE_ID.RECON_UNIT] = uiManager.getTextureID("recon_unit");
    TEXTURES[TEXTURE_ID.RECON_TERRAIN] = uiManager.getTextureID("recon_terrain");
    TEXTURES[TEXTURE_ID.RECON_NONE] = uiManager.getTextureID("recon_none");
    TEXTURES[TEXTURE_ID.RECON_MAIN] = uiManager.getTextureID("recon_mainframe");

    this.entitySprite = spriteManager.createEmptySprite();
    this.entitySprite.scale = 0.6;

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

    spriteManager.updateSprite(this.entitySprite.index, entity.config.sprites.idle_right, team.schema.id);
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

PlayUI.prototype.onDraw = function(display, screenX, screenY) {
    const { world, language, timer, textureLoader } = this.gameContext;
    const { mapManager } = world;
    const { realTime, deltaTime } = timer;
    const { context } = display;
    const worldMap = mapManager.getActiveMap();

    const drawX = this.cContext.positionX + this.cContext.camera.viewportWidth;
    const drawY = this.cContext.positionY + this.cContext.camera.viewportHeight;
    const tileX = this.inspector.lastX;
    const tileY = this.inspector.lastY;
    const beginX = drawX - 565;
        
    switch(this.inspector.state) {
        case MapInspector.STATE.NONE: {
            this.lastEntity = EntityManager.INVALID_ID;
            this.lines.length = 0;
            textureLoader.getTextureWithFallback(TEXTURES[TEXTURE_ID.RECON_NONE]).draw(display, beginX, drawY);
            break;
        }
        case MapInspector.STATE.TILE: {
            this.lastEntity = EntityManager.INVALID_ID;

            const { terrain } = worldMap.getTileType(this.gameContext, tileX, tileY);
            const climateType = worldMap.getClimateType(this.gameContext, tileX, tileY);

            textureLoader.getTextureWithFallback(TEXTURES[TEXTURE_ID.RECON_TERRAIN]).draw(display, beginX, drawY);

            this.drawTile(display, tileX, tileY, beginX, drawY);
            this.style.apply(context);

            context.fillText("Modifiers:", beginX + 478, drawY + 4);
            context.fillText(worldMap.getTileName(this.gameContext, tileX, tileY), beginX + 41, drawY + 4);

            this.regenerateLines(context, worldMap.getTileDesc(this.gameContext, tileX, tileY), 421);
            break;
        }
        case MapInspector.STATE.BUILDING: {
            this.lastEntity = EntityManager.INVALID_ID;
            textureLoader.getTextureWithFallback(TEXTURES[TEXTURE_ID.RECON_TERRAIN]).draw(display, beginX, drawY);
            break;
        }
        case MapInspector.STATE.ENTITY: {
            const entity = world.getEntityAt(tileX, tileY);

            if(this.lastEntity !== entity.getID()) {
                this.regenerateLines(context, entity.getDescription(this.gameContext), 215);
                this.lastEntity = entity.getID();
            }

            textureLoader.getTextureWithFallback(TEXTURES[TEXTURE_ID.RECON_UNIT]).draw(display, beginX, drawY);

            this.drawTile(display, tileX, tileY, beginX, drawY);
            this.updateInspectSprite(entity);
            this.entitySprite.onUpdate(realTime, deltaTime);
            this.entitySprite.onDraw(display, beginX + 1, drawY + 5);

            const armorX = beginX + 273;
            const weaponX = beginX + 351;
            const moveX = beginX + 429;
            const traitX = beginX + 476;
            const minRange = entity.config.minRange;
            const maxRange = entity.getMaxRange(this.gameContext);

            this.style.apply(context);
            context.fillText("Health:", armorX, drawY + 4);
            context.fillText(`${entity.health}/${entity.maxHealth}`, armorX, drawY + 20);
            context.fillText("Damage:", weaponX, drawY + 4);
            context.fillText(`${entity.damage}`, weaponX, drawY + 20);

            if(maxRange > 1) {
                context.fillText(`(${minRange}-${maxRange})`, weaponX, drawY + 30);
            }

            context.fillText("Move:", moveX, drawY + 4);
            context.fillText(`${entity.config.movementRange}`, moveX, drawY + 20);
            context.fillText("Modifiers:", beginX + 478, drawY + 4);
            context.fillText(entity.getName(this.gameContext), beginX + 41, drawY + 4);
            break;
        }
    }

    context.fillStyle = "#ffffff";
        
    switch(this.lines.length) {
        case 0: {
            break;
        }
        case 1: {
            context.fillText(this.lines[0], beginX + 39, drawY + 20);
            break;
        }
        case 2: {
            context.fillText(this.lines[0], beginX + 39, drawY + 20);
            context.fillText(this.lines[1], beginX + 39, drawY + 20 + 10);
            break;
        }
        default: {
            const frameIndex = Math.floor(this.lineTime % this.lines.length);

            context.fillText(this.lines[frameIndex], beginX + 39, drawY + 20);

            if(frameIndex < this.lines.length - 1) {
                context.fillText(this.lines[frameIndex + 1], beginX + 39, drawY + 20 + 10);
            }

            this.lineTime += this.gameContext.timer.deltaTime * 0.7;
            break;
        }
    }

    textureLoader.getTextureWithFallback(TEXTURES[TEXTURE_ID.RECON_MAIN]).draw(display, drawX - 16, this.cContext.positionY);
}