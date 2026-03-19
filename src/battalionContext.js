import { ClientGameContext } from "../engine/clientGameContext.js";
import { LanguageHandler } from "../engine/language/languageHandler.js";
import { PortraitHandler } from "./client/portraitHandler.js";
import { DialogueHandler } from "./client/dialogueHandler.js";
import { LAYER_TYPE } from "./enums.js";
import { MainMenuState } from "./states/mainMenu/mainMenu.js";
import { MapEditorState } from "./states/mapEditor/mapEditorState.js";
import { PlayState } from "./states/play.js";
import { TeamManager } from "./team/teamManager.js";
import { TypeRegistry } from "./type/typeRegistry.js";
import { ArenaState } from "./states/arena/arena.js";
import { UICore } from "./ui/uiCore.js";
import { ClientActionRouter } from "./client/actionRouter.js";
import { addDebug, registerClientActions } from "./systems/context.js";
import { resolveTileType } from "./enumHelpers.js";
import { ShadeCache } from "./shadeCache.js";

export const BattalionContext = function() {
    ClientGameContext.call(this);

    this.typeRegistry = new TypeRegistry();
    this.teamManager = new TeamManager();
    this.portraitHandler = new PortraitHandler();
    this.dialogueHandler = new DialogueHandler();
    this.uiCore = new UICore();
    this.actionRouter = new ClientActionRouter();
    this.shadeCache = new ShadeCache();

    this.timer.input = (deltaTime) => {
        this.client.update();
    }

    this.timer.update = (fDeltaTime) => {
        this.states.update(this);
        this.world.update(this);
    }

    this.timer.render = (deltaTime) => {
        this.textureLoader.update();
        this.applicationWindow.update(this);
        this.tweenManager.update(this);
        this.dialogueHandler.update(this);
        this.spriteManager.update(this);
        this.tileManager.update(this);
        this.renderer.update(this);
    }
}

BattalionContext.STATE = {
    PLAY: "PLAY",
    ARENA: "ARENA",
    MAIN_MENU: "MAIN_MENU",
    MAP_EDITOR: "MAP_EDITOR"
};

BattalionContext.prototype = Object.create(ClientGameContext.prototype);
BattalionContext.prototype.constructor = BattalionContext;

BattalionContext.prototype.init = function(resources) {
    this.tileManager.loadClient(this.textureLoader, resources.tiles, resources.tileMeta, resources.autotilers, resolveTileType);
    this.spriteManager.load(resources.spriteTextures, resources.sprites);
    this.uiManager.load(resources.layouts, resources.icons);
    this.fonts.load(resources.fonts);
    this.client.musicPlayer.load(resources.music, resources.playlists);
    this.client.soundPlayer.load(resources.sounds);
    this.client.socket.load(resources.network.socket);
    this.client.router.load(resources.keybinds);
    this.mapRegistry.load(resources.maps);
    this.language.load(resources.languages);

    this.spriteManager.initLayers(LAYER_TYPE._COUNT);
    this.typeRegistry.load(resources);

    registerClientActions(this);

    this.uiCore.init(this);
    this.language.selectLanguage(LanguageHandler.LANGUAGE.ENGLISH);
    this.portraitHandler.load(resources.portraits);

    this.states.addState(BattalionContext.STATE.MAIN_MENU, new MainMenuState());
    this.states.addState(BattalionContext.STATE.MAP_EDITOR, new MapEditorState());
    this.states.addState(BattalionContext.STATE.ARENA, new ArenaState());
    this.states.addState(BattalionContext.STATE.PLAY, new PlayState());
    this.states.setNextState(this, BattalionContext.STATE.MAIN_MENU);
    this.timer.start();
    addDebug(this);
}

BattalionContext.prototype.onExit = function() {
    this.teamManager.exit();
    this.portraitHandler.exit();
    this.dialogueHandler.exit();
    this.uiCore.exit();
    this.shadeCache.exit();
    addDebug(this);
}