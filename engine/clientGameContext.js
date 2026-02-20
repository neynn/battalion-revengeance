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
import { ApplicationWindow } from "./applicationWindow.js";
import { ClientPathHandler } from "./resources/pathHandler.js";
import { MapRegistry } from "../src/map/mapRegistry.js";
import { addDebug } from "../src/systems/context.js";

export const ClientGameContext = function() {
    this.client = new Client();
    this.world = new World();
    this.pathHandler = new ClientPathHandler();
    this.applicationWindow = new ApplicationWindow();
    this.renderer = new Renderer(window.innerWidth, window.innerHeight);
    this.resourceLoader = new ResourceLoader();
    this.tileManager = new TileManager();
    this.spriteManager = new SpriteManager(this.resourceLoader);
    this.uiManager = new UIManager(this.resourceLoader);
    this.language = new LanguageHandler();
    this.fonts = new FontHandler();
    this.states = new StateMachine(this);
    this.transform2D = new Transform2D();
    this.timer = new Timer();
    this.mapRegistry = new MapRegistry();

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
}

ClientGameContext.prototype.onExit = function() {}

ClientGameContext.prototype.exit = function() {
    this.client.exit(this);
    this.world.exit();
    this.renderer.exit();
    this.spriteManager.exit();
    this.uiManager.exit();
    this.language.exit();
    this.onExit();
    addDebug(this);
}