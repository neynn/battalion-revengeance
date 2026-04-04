import { TextureRegistry } from "../../engine/resources/texture/textureRegistry.js";

export const UIData = function(textureLoader) {
    this.textureLoader = textureLoader;
    this.textures = new Int16Array(UIData.TEXTURE._COUNT);

    for(let i = 0; i < UIData.TEXTURE._COUNT; i++) {
        this.textures[i] = TextureRegistry.INVALID_ID;
    }
}

UIData.TEXTURE = {
    RECON_UNIT: 0,
    RECON_TERRAIN: 1,
    RECON_NONE: 2,
    RECON_MAIN: 3,
    RECON_HEALTH: 4,
    ICONS: 5,
    TOOLTIP: 6,
    TOOLTIP_PLUS: 7,
    TOOLTIP_MINI: 8,
    DIALOGUE_NEXT: 9,
    DIALOGUE_SKIP: 10,
    DIALOGUE_BOX: 11,
    HUD_BUTTONS: 12,
    _COUNT: 13
};

UIData.prototype.getTexture = function(textureID) {
    return this.textureLoader.getTextureWithFallback(this.textures[textureID]);
}

UIData.prototype.loadPlayTextures = function() {
    this.textureLoader.loadTexture(this.textures[UIData.TEXTURE.RECON_UNIT]);
    this.textureLoader.loadTexture(this.textures[UIData.TEXTURE.RECON_TERRAIN]);
    this.textureLoader.loadTexture(this.textures[UIData.TEXTURE.RECON_NONE]);
    this.textureLoader.loadTexture(this.textures[UIData.TEXTURE.RECON_MAIN]);
    this.textureLoader.loadTexture(this.textures[UIData.TEXTURE.RECON_HEALTH]);
    this.textureLoader.loadTexture(this.textures[UIData.TEXTURE.ICONS]);
    this.textureLoader.loadTexture(this.textures[UIData.TEXTURE.TOOLTIP]);
    this.textureLoader.loadTexture(this.textures[UIData.TEXTURE.TOOLTIP_PLUS]);
    this.textureLoader.loadTexture(this.textures[UIData.TEXTURE.TOOLTIP_MINI]);
    this.textureLoader.loadTexture(this.textures[UIData.TEXTURE.DIALOGUE_NEXT]);
    this.textureLoader.loadTexture(this.textures[UIData.TEXTURE.DIALOGUE_SKIP]);
    this.textureLoader.loadTexture(this.textures[UIData.TEXTURE.DIALOGUE_BOX]);
    this.textureLoader.loadTexture(this.textures[UIData.TEXTURE.HUD_BUTTONS]);
}

UIData.prototype.load = function(gameContext) {
    const { uiManager } = gameContext;

    this.textures[UIData.TEXTURE.RECON_UNIT] = uiManager.getTextureID("recon_unit");
    this.textures[UIData.TEXTURE.RECON_TERRAIN] = uiManager.getTextureID("recon_terrain");
    this.textures[UIData.TEXTURE.RECON_NONE] = uiManager.getTextureID("recon_none");
    this.textures[UIData.TEXTURE.RECON_MAIN] = uiManager.getTextureID("recon_mainframe");
    this.textures[UIData.TEXTURE.ICONS] = uiManager.getTextureID("icons");
    this.textures[UIData.TEXTURE.RECON_HEALTH] = uiManager.getTextureID("recon_health");
    this.textures[UIData.TEXTURE.TOOLTIP] = uiManager.getTextureID("recon_tooltip");
    this.textures[UIData.TEXTURE.TOOLTIP_PLUS] = uiManager.getTextureID("recon_tooltip_plus");
    this.textures[UIData.TEXTURE.TOOLTIP_MINI] = uiManager.getTextureID("recon_tooltip_mini");
    this.textures[UIData.TEXTURE.DIALOGUE_NEXT] = uiManager.getTextureID("dialogue_next_arrow");
    this.textures[UIData.TEXTURE.DIALOGUE_SKIP] = uiManager.getTextureID("dialogue_skip_button");
    this.textures[UIData.TEXTURE.DIALOGUE_BOX] = uiManager.getTextureID("dialogue_text_box");
    this.textures[UIData.TEXTURE.HUD_BUTTONS] = uiManager.getTextureID("hud_buttons");
}