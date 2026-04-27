import { ClientGameContext } from "../engine/clientGameContext.js";
import { LanguageHandler } from "../engine/language/languageHandler.js";
import { LAYER_TYPE, TILE_ID, TILE_TYPE } from "./enums.js";
import { MainMenuState } from "./states/mainMenu/mainMenu.js";
import { MapEditorState } from "./states/mapEditor/mapEditorState.js";
import { StoryState } from "./states/story/story.js";
import { TeamManager } from "./team/teamManager.js";
import { TypeRegistry } from "./type/typeRegistry.js";
import { ArenaState } from "./states/arena/arena.js";
import { addDebug, overrideRiverTiles, registerActionVTables, registerClientActions } from "./systems/context.js";
import { resolveTileType } from "./enumHelpers.js";
import { ShadeCache } from "./shadeCache.js";
import { MapRegistry } from "./map/mapRegistry.js";
import { ClientActionRouter } from "./action/router/clientActionRouter.js";
import { UIData } from "./ui/uiData.js";
import { MissionManager } from "./mission/missionManager.js";

export const BattalionContext = function() {
    ClientGameContext.call(this);

    this.typeRegistry = new TypeRegistry();
    this.teamManager = new TeamManager();
    this.actionRouter = new ClientActionRouter();
    this.shadeCache = new ShadeCache();
    this.mapRegistry = new MapRegistry();
    this.missionManager = new MissionManager();
    this.uiData = new UIData(this.textureLoader);
}

BattalionContext.STATE = {
    STORY: "STORY",
    ARENA: "ARENA",
    MAIN_MENU: "MAIN_MENU",
    MAP_EDITOR: "MAP_EDITOR"
};

BattalionContext.prototype = Object.create(ClientGameContext.prototype);
BattalionContext.prototype.constructor = BattalionContext;

BattalionContext.prototype.init = function(resources) {
    this.tileManager.load(resources.tileCategories, resources.logicTiles, resources.visualTiles, resources.autotilers, resolveTileType);
    this.tileManager.createVisuals(this.textureLoader, resources.tiles);
    this.tileManager.enableAllVisuals();
    overrideRiverTiles(this);

    this.spriteManager.load(resources.spriteTextures, resources.sprites);
    this.uiManager.load(this.textureLoader, resources.layouts, resources.gui);
    this.fonts.load(resources.fonts);
    this.client.musicPlayer.load(resources.music, resources.playlists);
    this.client.soundPlayer.load(resources.sounds);
    this.client.socket.load(resources.network.socket);
    this.client.router.load(resources.keybinds);
    this.mapRegistry.load(resources.maps);
    this.language.load(resources.languages);
    this.missionManager.load(resources);
    this.spriteManager.initLayers(LAYER_TYPE._COUNT);
    this.typeRegistry.load(resources);
    this.uiData.load();

    registerActionVTables(this);
    registerClientActions(this);

    this.language.selectLanguage(LanguageHandler.LANGUAGE.ENGLISH);

    this.states.addState(BattalionContext.STATE.MAIN_MENU, new MainMenuState());
    this.states.addState(BattalionContext.STATE.MAP_EDITOR, new MapEditorState());
    this.states.addState(BattalionContext.STATE.ARENA, new ArenaState());
    this.states.addState(BattalionContext.STATE.STORY, new StoryState());
    this.states.setNextState(this, BattalionContext.STATE.MAIN_MENU);
    this.timer.start();
    addDebug(this);
}

BattalionContext.prototype.onExit = function() {
    this.teamManager.exit();
    this.shadeCache.exit();
    this.missionManager.exit();
    addDebug(this);
}