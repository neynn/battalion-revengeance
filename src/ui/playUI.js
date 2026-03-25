import { TextStyle } from "../../engine/graphics/textStyle.js";
import { TextureRegistry } from "../../engine/resources/texture/textureRegistry.js";
import { SpriteManager } from "../../engine/sprite/spriteManager.js";
import { UIContext } from "../../engine/ui/uiContext.js";
import { MapInspector } from "../actors/player/inspector.js";
import { TILE_ID } from "../enums.js";
import { BattalionMap } from "../map/battalionMap.js";

const generateLines = function(context, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let line = '';

    for(let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;
        
        if(testWidth > maxWidth && line !== '') {
            lines.push(line.trim());
            line = words[i] + ' ';
        } else {
            line = testLine;
        }
    }

    if(line) {
        lines.push(line.trim());
    }

    return lines;
}

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

    switch(this.inspector.state) {
        case MapInspector.STATE.NONE: {
            const beginX = drawX - 565;

            textureLoader.getTextureWithFallback(TEXTURES[TEXTURE_ID.RECON_NONE]).draw(display, beginX, drawY);
            break;
        }
        case MapInspector.STATE.TILE: {
            const { terrain } = worldMap.getTileType(this.gameContext, tileX, tileY);
            const climateType = worldMap.getClimateType(this.gameContext, tileX, tileY);
            const beginX = drawX - 565;

            textureLoader.getTextureWithFallback(TEXTURES[TEXTURE_ID.RECON_TERRAIN]).draw(display, beginX, drawY);

            this.drawTile(display, tileX, tileY, beginX, drawY);


            this.style.apply(context);
            context.fillText("Modifiers:", beginX + 478, drawY + 4);
            context.fillText(worldMap.getTileName(this.gameContext, tileX, tileY), beginX + 41, drawY + 4);

            const description = generateLines(context, worldMap.getTileDesc(this.gameContext, tileX, tileY), 421);
            const length = description.length > 2 ? 2 : description.length;

            context.fillStyle = "#ffffff";

            for(let i = 0; i < length; i++) {
                context.fillText(description[i], beginX + 39, drawY + 20 + 10 * i);
            }

            break;
        }
        case MapInspector.STATE.BUILDING: {
            const beginX = drawX - 565;

            textureLoader.getTextureWithFallback(TEXTURES[TEXTURE_ID.RECON_TERRAIN]).draw(display, beginX, drawY);
            break;
        }
        case MapInspector.STATE.ENTITY: {
            const beginX = drawX - 565;
            const entity = world.getEntityAt(tileX, tileY);

            textureLoader.getTextureWithFallback(TEXTURES[TEXTURE_ID.RECON_UNIT]).draw(display, beginX, drawY);

            this.drawTile(display, tileX, tileY, beginX, drawY);
            this.updateInspectSprite(entity);
            this.entitySprite.onUpdate(realTime, deltaTime);
            this.entitySprite.onDraw(display, beginX + 1, drawY + 5);

            const armorX = beginX + 273;
            const armorY = drawY + 20;

            const weaponX = beginX + 351;
            const weaponY = drawY + 20;

            const moveX = beginX + 429;
            const moveY = drawY + 20;

            const traitX = beginX + 476;
            const traitY = drawY + 20;
    
            this.style.apply(context);
            context.fillText("Health:", armorX, drawY + 4);
            context.fillText("Damage:", weaponX, drawY + 4);
            context.fillText("Move:", moveX, drawY + 4);
            context.fillText("Modifiers:", beginX + 478, drawY + 4);
            context.fillText(entity.getName(this.gameContext), beginX + 41, drawY + 4);

            const description = generateLines(context, entity.getDescription(this.gameContext), 215);
            const length = description.length > 2 ? 2 : description.length;

            context.fillStyle = "#ffffff";

            for(let i = 0; i < length; i++) {
                context.fillText(description[i], beginX + 39, drawY + 20 + 10 * i);
            }

            break;
        }
    }

    textureLoader.getTextureWithFallback(TEXTURES[TEXTURE_ID.RECON_MAIN]).draw(display, drawX - 16, this.cContext.positionY);
}