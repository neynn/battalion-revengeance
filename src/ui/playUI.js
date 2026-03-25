import { TextureRegistry } from "../../engine/resources/texture/textureRegistry.js";
import { SpriteManager } from "../../engine/sprite/spriteManager.js";
import { UIContext } from "../../engine/ui/uiContext.js";
import { MapInspector } from "../actors/player/inspector.js";
import { TILE_ID } from "../enums.js";
import { BattalionMap } from "../map/battalionMap.js";

const TILE_DRAW_ORDER = [
    BattalionMap.LAYER.GROUND,
    BattalionMap.LAYER.DECORATION,
    BattalionMap.LAYER.CLOUD
];

export const PlayUI = function(inspector, cContext, gameContext) {
    UIContext.call(this);

    this.reconUnitTexture = TextureRegistry.EMPTY_TEXTURE;
    this.reconTerrainTexture = TextureRegistry.EMPTY_TEXTURE;
    this.reconMainframeTexture = TextureRegistry.EMPTY_TEXTURE;
    this.reconNoneTexture = TextureRegistry.EMPTY_TEXTURE;
    this.inspector = inspector;
    this.cContext = cContext;
    this.gameContext = gameContext;
    this.entitySprite = SpriteManager.EMPTY_SPRITE;
}

PlayUI.prototype = Object.create(UIContext.prototype);
PlayUI.prototype.constructor = PlayUI;

PlayUI.prototype.load = function(gameContext) {
    const { uiManager, spriteManager } = gameContext;
    
    this.reconUnitTexture = uiManager.getUITexture("recon_unit");
    this.reconTerrainTexture = uiManager.getUITexture("recon_terrain");
    this.reconMainframeTexture = uiManager.getUITexture("recon_mainframe");
    this.reconNoneTexture = uiManager.getUITexture("recon_none");
    this.entitySprite = spriteManager.createEmptySprite();
    this.entitySprite.scale = 0.6;

    uiManager.addContext(this);
}

//TODO(neyn): Create a 28x28 ICON for each entity!
//This icon gets drawn instead of a full sprite!
PlayUI.prototype.updateInspectSprite = function(entity) {
    const { spriteManager } = this.gameContext;
    const team = entity.getTeam(this.gameContext);

    spriteManager.updateSprite(this.entitySprite.index, entity.config.sprites.idle_right, team.schema.id);
}

PlayUI.prototype.onDraw = function(display, screenX, screenY) {
    const { tileManager, world, language, timer } = this.gameContext;
    const { mapManager } = world;
    const { realTime, deltaTime } = timer;
    const worldMap = mapManager.getActiveMap();

    const drawX = this.cContext.positionX + this.cContext.camera.viewportWidth;
    const drawY = this.cContext.positionY + this.cContext.camera.viewportHeight;
    const tileX = this.inspector.lastX;
    const tileY = this.inspector.lastY;

    switch(this.inspector.state) {
        case MapInspector.STATE.NONE: {
            const beginX = drawX - 565;

            this.reconNoneTexture.draw(display, beginX, drawY);
            break;
        }
        case MapInspector.STATE.TILE: {
            const tileType = worldMap.getTileType(this.gameContext, tileX, tileY);
            const climateType = worldMap.getClimateType(this.gameContext, tileX, tileY);
            const beginX = drawX - 565;

            this.reconTerrainTexture.draw(display, beginX, drawY);

            for(const layerID of TILE_DRAW_ORDER) {
                const tileID = worldMap.getTile(layerID, tileX, tileY);

                if(tileID > TILE_ID.NONE) {
                    this.cContext.camera.drawTile(tileManager, tileID, display.context, beginX + 4, drawY + 11, 0.5);
                }
            }

            //TODO(neyn): Draw climate icon & draw tile 
            break;
        }
        case MapInspector.STATE.BUILDING: {
            const beginX = drawX - 565;

            this.reconTerrainTexture.drawOffset(display, drawX, drawY);
            break;
        }
        case MapInspector.STATE.ENTITY: {
            const beginX = drawX - 565;
            const entity = world.getEntityAt(tileX, tileY);

            this.updateInspectSprite(entity);
            this.reconUnitTexture.draw(display, beginX, drawY);
            this.entitySprite.onUpdate(realTime, deltaTime);
            this.entitySprite.onDraw(display, beginX + 1, drawY + 5);
            break;
        }
    }

    this.reconMainframeTexture.draw(display, drawX - 16, this.cContext.positionY);
}