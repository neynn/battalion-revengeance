import { TextureRegistry } from "../../engine/resources/texture/textureRegistry.js";
import { UI_TEXTURE } from "./constants.js";

export const UIData = function(textureLoader) {
    this.textureLoader = textureLoader;
    this.textures = new Int16Array(UI_TEXTURE._COUNT);

    for(let i = 0; i < UI_TEXTURE._COUNT; i++) {
        this.textures[i] = TextureRegistry.INVALID_ID;
    }
}

UIData.prototype.getTexture = function(textureID) {
    return this.textureLoader.getTextureWithFallback(this.textures[textureID]);
}

UIData.prototype.loadMainMenuTextures = function() {
    this.loadGenericTextures();
    this.textureLoader.loadTexture(this.textures[UI_TEXTURE.STORY_MAIN_MENU_BORDER]);
}

UIData.prototype.loadGenericTextures = function() {
    this.textureLoader.loadTexture(this.textures[UI_TEXTURE.GENERIC_BUTTON]);   
}

UIData.prototype.loadStoryTextures = function() {
    this.textureLoader.loadTexture(this.textures[UI_TEXTURE.PLAQUE]);
    this.textureLoader.loadTexture(this.textures[UI_TEXTURE.PLAQUE_DISABLED]);
    this.textureLoader.loadTexture(this.textures[UI_TEXTURE.STORY_CHAPTER_PANEL]);
    this.textureLoader.loadTexture(this.textures[UI_TEXTURE.STORY_EMBLEM_SLOT]);
    this.textureLoader.loadTexture(this.textures[UI_TEXTURE.STORY_MAIN_MENU_BORDER]);
    this.textureLoader.loadTexture(this.textures[UI_TEXTURE.STORY_MISSION_PANEL]);
    this.textureLoader.loadTexture(this.textures[UI_TEXTURE.STORY_EMBLEMS]);
    this.textureLoader.loadTexture(this.textures[UI_TEXTURE.STORY_START]);
    this.textureLoader.loadTexture(this.textures[UI_TEXTURE.ARROW]);
    this.textureLoader.loadTexture(this.textures[UI_TEXTURE.STORY_PANELS]);
    this.textureLoader.loadTexture(this.textures[UI_TEXTURE.STORY_PORTRAITS]);
}

UIData.prototype.loadPlayTextures = function() {
    this.textureLoader.loadTexture(this.textures[UI_TEXTURE.RECON_UNIT]);
    this.textureLoader.loadTexture(this.textures[UI_TEXTURE.RECON_TERRAIN]);
    this.textureLoader.loadTexture(this.textures[UI_TEXTURE.RECON_NONE]);
    this.textureLoader.loadTexture(this.textures[UI_TEXTURE.RECON_MAIN]);
    this.textureLoader.loadTexture(this.textures[UI_TEXTURE.RECON_HEALTH]);
    this.textureLoader.loadTexture(this.textures[UI_TEXTURE.ICONS]);
    this.textureLoader.loadTexture(this.textures[UI_TEXTURE.TOOLTIP]);
    this.textureLoader.loadTexture(this.textures[UI_TEXTURE.TOOLTIP_PLUS]);
    this.textureLoader.loadTexture(this.textures[UI_TEXTURE.TOOLTIP_MINI]);
    this.textureLoader.loadTexture(this.textures[UI_TEXTURE.DIALOGUE_SKIP]);
    this.textureLoader.loadTexture(this.textures[UI_TEXTURE.DIALOGUE_BOX]);
    this.textureLoader.loadTexture(this.textures[UI_TEXTURE.HUD_BUTTONS]);
    this.textureLoader.loadTexture(this.textures[UI_TEXTURE.HUD_GLASSPLATE]);
    this.textureLoader.loadTexture(this.textures[UI_TEXTURE.ARROW]);
}

UIData.prototype.load = function(gameContext) {
    const { uiManager } = gameContext;

    this.textures[UI_TEXTURE.RECON_UNIT] = uiManager.getTextureID("recon_unit");
    this.textures[UI_TEXTURE.RECON_TERRAIN] = uiManager.getTextureID("recon_terrain");
    this.textures[UI_TEXTURE.RECON_NONE] = uiManager.getTextureID("recon_none");
    this.textures[UI_TEXTURE.RECON_MAIN] = uiManager.getTextureID("recon_mainframe");
    this.textures[UI_TEXTURE.ICONS] = uiManager.getTextureID("icons");
    this.textures[UI_TEXTURE.RECON_HEALTH] = uiManager.getTextureID("recon_health");
    this.textures[UI_TEXTURE.TOOLTIP] = uiManager.getTextureID("recon_tooltip");
    this.textures[UI_TEXTURE.TOOLTIP_PLUS] = uiManager.getTextureID("recon_tooltip_plus");
    this.textures[UI_TEXTURE.TOOLTIP_MINI] = uiManager.getTextureID("recon_tooltip_mini");
    this.textures[UI_TEXTURE.DIALOGUE_SKIP] = uiManager.getTextureID("dialogue_skip_button");
    this.textures[UI_TEXTURE.DIALOGUE_BOX] = uiManager.getTextureID("dialogue_text_box");
    this.textures[UI_TEXTURE.HUD_BUTTONS] = uiManager.getTextureID("hud_buttons");
    this.textures[UI_TEXTURE.HUD_GLASSPLATE] = uiManager.getTextureID("hud_glassplate");

    this.textures[UI_TEXTURE.PLAQUE] = uiManager.getTextureID("plaque");
    this.textures[UI_TEXTURE.PLAQUE_DISABLED] = uiManager.getTextureID("plaque_disabled");

    this.textures[UI_TEXTURE.STORY_CHAPTER_PANEL] = uiManager.getTextureID("story_chapter_panel");
    this.textures[UI_TEXTURE.STORY_EMBLEM_SLOT] = uiManager.getTextureID("story_emblem_slot");
    this.textures[UI_TEXTURE.STORY_MAIN_MENU_BORDER] = uiManager.getTextureID("story_main_menu_border");
    this.textures[UI_TEXTURE.STORY_MISSION_PANEL] = uiManager.getTextureID("story_mission_panel");
    this.textures[UI_TEXTURE.STORY_EMBLEMS] = uiManager.getTextureID("story_emblems");
    this.textures[UI_TEXTURE.STORY_START] = uiManager.getTextureID("story_start_button");

    this.textures[UI_TEXTURE.GENERIC_BUTTON] = uiManager.getTextureID("generic_button");
    this.textures[UI_TEXTURE.ARROW] = uiManager.getTextureID("arrow");
    this.textures[UI_TEXTURE.STORY_PANELS] = uiManager.getTextureID("story_panels");
    this.textures[UI_TEXTURE.STORY_PORTRAITS] = uiManager.getTextureID("story_portraits");
}