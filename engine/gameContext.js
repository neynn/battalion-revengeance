import { Client } from "./client/client.js";
import { Cursor } from "./client/cursor.js";
import { SpriteManager } from "./sprite/spriteManager.js";
import { UIManager } from "./ui/uiManager.js";
import { StateMachine } from "./state/stateMachine.js";
import { Timer } from "./timer.js";
import { TileManager } from "./tile/tileManager.js";
import { Renderer } from "./renderer/renderer.js";
import { World } from "./world/world.js";
import { LanguageHandler } from "./language/languageHandler.js";
import { Transform2D } from "./math/transform2D.js";
import { FontHandler } from "./fontHandler.js";
import { MapManager } from "./map/mapManager.js";
import { ResourceLoader } from "./resources/resourceLoader.js";
import { ContextWindow } from "./contextWindow.js";
import { ActionRouter } from "./client/actionRouter.js";
import { TurnManager } from "./world/turn/turnManager.js";

export const GameContext = function() {
    this.client = new Client();
    this.world = new World();
    this.contextWindow = new ContextWindow();
    this.renderer = new Renderer(window.innerWidth, window.innerHeight);
    this.resourceLoader = new ResourceLoader();
    this.tileManager = new TileManager(this.resourceLoader);
    this.spriteManager = new SpriteManager(this.resourceLoader);
    this.uiManager = new UIManager(this.resourceLoader);
    this.language = new LanguageHandler();
    this.fonts = new FontHandler();
    this.states = new StateMachine(this);
    this.transform2D = new Transform2D();
    this.timer = new Timer();
    this.actionRouter = new ActionRouter();

    this.timer.input = () => {
        this.client.update();
        this.uiManager.update(this);
    }

    this.timer.update = () => {
        this.states.update(this);
        this.world.update(this);
    }

    this.timer.render = () => {
        this.contextWindow.update(this);
        this.spriteManager.update(this);
        this.tileManager.update(this);
        this.renderer.update(this);
    }

    this.client.cursor.events.on(Cursor.EVENT.BUTTON_CLICK, (event) => {
        const { button } = event;

        if(button === Cursor.BUTTON.LEFT) {
            this.uiManager.handleClick(event);
        }
    }, { permanent: true });

    this.world.mapManager.events.on(MapManager.EVENT.MAP_ENABLE, ({ map }) => {
        const { width, height } = map;

        this.renderer.onMapSizeUpdate(width, height);
    }, { permanent: true });

    this.world.mapManager.events.on(MapManager.EVENT.MAP_DISABLE, ({ id, map }) => {
        this.language.clearMapTranslations();
    }, { permanent: true });

    this.client.cursor.events.on(Cursor.EVENT.BUTTON_DOWN, ({ button, x, y, radius }) => {
        this.renderer.onDragStart(button, x, y, radius);
    }, { permanent: true });

    this.client.cursor.events.on(Cursor.EVENT.BUTTON_DRAG, ({ button, deltaX, deltaY }) => {
        this.renderer.onDragUpdate(button, deltaX, deltaY);
    }, { permanent: true });

    this.client.cursor.events.on(Cursor.EVENT.BUTTON_UP, ({ button }) => {
        this.renderer.onDragEnd(button);
    }, { permanent: true });

    this.world.turnManager.events.on(TurnManager.EVENT.NEXT_TURN, ({ turn }) => {
        this.world.eventHandler.onTurnChange(this, turn);
    }, { permanent: true });

    this.world.turnManager.events.on(TurnManager.EVENT.NEXT_ROUND, ({ round }) => {
        this.world.eventHandler.onRoundChange(this, round);
    }, { permanent: true });

    this.addDebug();
}

GameContext.prototype.onExit = function() {}

GameContext.prototype.exit = function() {
    this.client.exit(this);
    this.world.exit();
    this.renderer.exit();
    this.spriteManager.exit();
    this.uiManager.exit();
    this.language.exit();
    this.onExit();
    this.addDebug();
}

GameContext.prototype.loadResources = function(resources) {
    this.tileManager.load(resources.tiles, resources.tileMeta, resources.autotilers);
    this.spriteManager.load(resources.spriteTextures, resources.sprites);
    this.uiManager.load(resources.interfaces, resources.icons);
    this.fonts.load(resources.fonts);
    this.client.musicPlayer.load(resources.music, resources.playlists);
    this.client.soundPlayer.load(resources.sounds);
    this.client.socket.load(resources.network.socket);
    this.client.router.load(resources.keybinds);
    this.world.mapManager.load(resources.maps);
    this.world.entityManager.load();
    this.world.turnManager.load();
    this.language.load(resources.languages);
}

GameContext.prototype.addDebug = function() {
    const { router } = this.client;

    router.bind(this, "DEBUG");
    router.on("DEBUG_MAP", () => Renderer.DEBUG.MAP = 1 - Renderer.DEBUG.MAP);
    router.on("DEBUG_CONTEXT", () => Renderer.DEBUG.CONTEXT = 1 - Renderer.DEBUG.CONTEXT);
    router.on("DEBUG_INTERFACE", () => Renderer.DEBUG.INTERFACE = 1 - Renderer.DEBUG.INTERFACE);
    router.on("DEBUG_SPRITES", () => Renderer.DEBUG.SPRITES = 1 - Renderer.DEBUG.SPRITES);
    router.on("DEBUG_INFO", () => Renderer.DEBUG.INFO = 1 - Renderer.DEBUG.INFO);
}

GameContext.prototype.getActiveMap = function() {
    return this.world.mapManager.getActiveMap();
}