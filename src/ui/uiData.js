import { TextureRegistry } from "../../engine/resources/texture/textureRegistry.js";
import { UI_TEXTURE } from "./constants.js";

/**
 * 
 * @param {TextureRegistry} textureRegistry 
 */
export const UIData = function(textureRegistry) {
    this.textureRegistry = textureRegistry;
    this.textures = new Int16Array(UI_TEXTURE._COUNT);

    for(let i = 0; i < UI_TEXTURE._COUNT; i++) {
        this.textures[i] = TextureRegistry.INVALID_ID;
    }
}

UIData.prototype.getTexture = function(textureID) {
    return this.textureRegistry.getTextureWithFallback(this.textures[textureID]);
}

UIData.prototype.loadMainMenuTextures = function() {
    this.loadGenericTextures();
    this.textureRegistry.loadTexture(this.textures[UI_TEXTURE.STORY_MAIN_MENU_BORDER]);
}

UIData.prototype.loadGenericTextures = function() {
    this.textureRegistry.loadTexture(this.textures[UI_TEXTURE.GENERIC_BUTTON]);   
}

UIData.prototype.loadStoryTextures = function() {
    this.textureRegistry.loadTexture(this.textures[UI_TEXTURE.PLAQUE]);
    this.textureRegistry.loadTexture(this.textures[UI_TEXTURE.PLAQUE_DISABLED]);
    this.textureRegistry.loadTexture(this.textures[UI_TEXTURE.STORY_CHAPTER_PANEL]);
    this.textureRegistry.loadTexture(this.textures[UI_TEXTURE.STORY_EMBLEM_SLOT]);
    this.textureRegistry.loadTexture(this.textures[UI_TEXTURE.STORY_MAIN_MENU_BORDER]);
    this.textureRegistry.loadTexture(this.textures[UI_TEXTURE.STORY_MISSION_PANEL]);
    this.textureRegistry.loadTexture(this.textures[UI_TEXTURE.STORY_EMBLEMS]);
    this.textureRegistry.loadTexture(this.textures[UI_TEXTURE.STORY_START]);
    this.textureRegistry.loadTexture(this.textures[UI_TEXTURE.ARROW]);
    this.textureRegistry.loadTexture(this.textures[UI_TEXTURE.STORY_PANELS]);
    this.textureRegistry.loadTexture(this.textures[UI_TEXTURE.STORY_PORTRAITS]);
}

UIData.prototype.loadPlayTextures = function() {
    this.textureRegistry.loadTexture(this.textures[UI_TEXTURE.RECON_UNIT]);
    this.textureRegistry.loadTexture(this.textures[UI_TEXTURE.RECON_TERRAIN]);
    this.textureRegistry.loadTexture(this.textures[UI_TEXTURE.RECON_NONE]);
    this.textureRegistry.loadTexture(this.textures[UI_TEXTURE.RECON_MAIN]);
    this.textureRegistry.loadTexture(this.textures[UI_TEXTURE.RECON_HEALTH]);
    this.textureRegistry.loadTexture(this.textures[UI_TEXTURE.ICONS]);
    this.textureRegistry.loadTexture(this.textures[UI_TEXTURE.TOOLTIP]);
    this.textureRegistry.loadTexture(this.textures[UI_TEXTURE.TOOLTIP_PLUS]);
    this.textureRegistry.loadTexture(this.textures[UI_TEXTURE.TOOLTIP_MINI]);
    this.textureRegistry.loadTexture(this.textures[UI_TEXTURE.DIALOGUE_SKIP]);
    this.textureRegistry.loadTexture(this.textures[UI_TEXTURE.DIALOGUE_BOX]);
    this.textureRegistry.loadTexture(this.textures[UI_TEXTURE.HUD_BUTTONS]);
    this.textureRegistry.loadTexture(this.textures[UI_TEXTURE.HUD_GLASSPLATE]);
    this.textureRegistry.loadTexture(this.textures[UI_TEXTURE.ARROW]);
    this.textureRegistry.loadTexture(this.textures[UI_TEXTURE.MORALE_ICONS]);
}

UIData.prototype.load = function() {
    this.textures[UI_TEXTURE.RECON_UNIT] = this.textureRegistry.getTextureID("ui:recon_unit");
    this.textures[UI_TEXTURE.RECON_TERRAIN] = this.textureRegistry.getTextureID("ui:recon_terrain");
    this.textures[UI_TEXTURE.RECON_NONE] = this.textureRegistry.getTextureID("ui:recon_none");
    this.textures[UI_TEXTURE.RECON_MAIN] = this.textureRegistry.getTextureID("ui:recon_mainframe");
    this.textures[UI_TEXTURE.ICONS] = this.textureRegistry.getTextureID("ui:icons");
    this.textures[UI_TEXTURE.RECON_HEALTH] = this.textureRegistry.getTextureID("ui:recon_health");
    this.textures[UI_TEXTURE.TOOLTIP] = this.textureRegistry.getTextureID("ui:recon_tooltip");
    this.textures[UI_TEXTURE.TOOLTIP_PLUS] = this.textureRegistry.getTextureID("ui:recon_tooltip_plus");
    this.textures[UI_TEXTURE.TOOLTIP_MINI] = this.textureRegistry.getTextureID("ui:recon_tooltip_mini");
    this.textures[UI_TEXTURE.DIALOGUE_SKIP] = this.textureRegistry.getTextureID("ui:dialogue_skip_button");
    this.textures[UI_TEXTURE.DIALOGUE_BOX] = this.textureRegistry.getTextureID("ui:dialogue_text_box");
    this.textures[UI_TEXTURE.HUD_BUTTONS] = this.textureRegistry.getTextureID("ui:hud_buttons");
    this.textures[UI_TEXTURE.HUD_GLASSPLATE] = this.textureRegistry.getTextureID("ui:hud_glassplate");
    this.textures[UI_TEXTURE.PLAQUE] = this.textureRegistry.getTextureID("ui:plaque");
    this.textures[UI_TEXTURE.PLAQUE_DISABLED] = this.textureRegistry.getTextureID("ui:plaque_disabled");
    this.textures[UI_TEXTURE.STORY_CHAPTER_PANEL] = this.textureRegistry.getTextureID("ui:story_chapter_panel");
    this.textures[UI_TEXTURE.STORY_EMBLEM_SLOT] = this.textureRegistry.getTextureID("ui:story_emblem_slot");
    this.textures[UI_TEXTURE.STORY_MAIN_MENU_BORDER] = this.textureRegistry.getTextureID("ui:story_main_menu_border");
    this.textures[UI_TEXTURE.STORY_MISSION_PANEL] = this.textureRegistry.getTextureID("ui:story_mission_panel");
    this.textures[UI_TEXTURE.STORY_EMBLEMS] = this.textureRegistry.getTextureID("ui:story_emblems");
    this.textures[UI_TEXTURE.STORY_START] = this.textureRegistry.getTextureID("ui:story_start_button");
    this.textures[UI_TEXTURE.GENERIC_BUTTON] = this.textureRegistry.getTextureID("ui:generic_button");
    this.textures[UI_TEXTURE.ARROW] = this.textureRegistry.getTextureID("ui:arrow");
    this.textures[UI_TEXTURE.STORY_PANELS] = this.textureRegistry.getTextureID("ui:story_panels");
    this.textures[UI_TEXTURE.STORY_PORTRAITS] = this.textureRegistry.getTextureID("ui:story_portraits");
    this.textures[UI_TEXTURE.MORALE_ICONS] = this.textureRegistry.getTextureID("ui:morale_icons");
}