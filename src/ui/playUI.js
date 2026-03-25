import { TextureRegistry } from "../../engine/resources/texture/textureRegistry.js";
import { UIContext } from "../../engine/ui/uiContext.js";
import { MapInspector } from "../actors/player/inspector.js";

export const PlayUI = function(inspector, cContext) {
    UIContext.call(this);

    this.reconUnitTexture = TextureRegistry.EMPTY_TEXTURE;
    this.reconTerrainTexture = TextureRegistry.EMPTY_TEXTURE;
    this.reconMainframeTexture = TextureRegistry.EMPTY_TEXTURE;
    this.inspector = inspector;
    this.cContext = cContext;
}

PlayUI.prototype = Object.create(UIContext.prototype);
PlayUI.prototype.constructor = PlayUI;

PlayUI.prototype.load = function(gameContext) {
    const { uiManager } = gameContext;
    
    this.reconUnitTexture = uiManager.getUITexture("recon_unit");
    this.reconTerrainTexture = uiManager.getUITexture("recon_terrain");
    this.reconMainframeTexture = uiManager.getUITexture("recon_mainframe");

    uiManager.addContext(this);
}

PlayUI.prototype.onDraw = function(display, screenX, screenY) {
    const drawX = this.cContext.positionX + this.cContext.camera.viewportWidth;
    const drawY = this.cContext.positionY + this.cContext.camera.viewportHeight;

    switch(this.inspector.state) {
        case MapInspector.STATE.TILE: {
            this.reconTerrainTexture.drawOffset(display, drawX, drawY);
            break;
        }
        case MapInspector.STATE.BUILDING: {
            this.reconTerrainTexture.drawOffset(display, drawX, drawY);
            break;
        }
        case MapInspector.STATE.ENTITY: {
            this.reconUnitTexture.drawOffset(display, drawX, drawY);
            break;
        }
    }

    this.reconMainframeTexture.draw(display, drawX - 16, this.cContext.positionY - 40);
}