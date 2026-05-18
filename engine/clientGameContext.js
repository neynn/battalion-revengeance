import { Client } from "./client/client.js";
import { Cursor } from "./client/cursor/cursor.js";
import { SpriteManager } from "./sprite/spriteManager.js";
import { UIManager } from "./ui/uiManager.js";
import { StateMachine } from "./state/stateMachine.js";
import { Timer } from "./timer.js";
import { TileManager } from "./tile/tileManager.js";
import { ContextManager } from "./renderer/contextManager.js";
import { World } from "./world/world.js";
import { LanguageHandler } from "./language/languageHandler.js";
import { FontHandler } from "./fontHandler.js";
import { TextureLoader } from "./resources/texture/textureLoader.js";
import { GameWindow } from "./gameWindow.js";
import { PathHandler } from "./resources/pathHandler.js";
import { TweenManager } from "./tween/tweenManager.js";
import { DialogueHandler } from "./dialogueHandler.js";

export const ClientGameContext = function() {
    this.client = new Client();
    this.world = new World();
    this.pathHandler = PathHandler;
    this.gameWindow = new GameWindow();
    this.contextManager = new ContextManager(window.innerWidth, window.innerHeight);
    this.textureLoader = new TextureLoader();
    this.tileManager = new TileManager();
    this.spriteManager = new SpriteManager(this.textureLoader);
    this.uiManager = new UIManager(this.textureLoader);
    this.language = new LanguageHandler();
    this.fonts = new FontHandler();
    this.states = new StateMachine(this);
    this.timer = new Timer();
    this.tweenManager = new TweenManager();
    this.dialogueHandler = new DialogueHandler();
    this.isClient = true;

    this.timer.work = () => {
        this.gameWindow.update(this);
        this.textureLoader.update();
    }

    this.timer.input = () => {
        this.client.update();
        this.uiManager.update(this);
    }

    this.timer.update = () => {
        this.states.update(this);
        this.world.update(this);
    }

    this.timer.render = () => {
        this.dialogueHandler.update(this);
        this.tweenManager.update(this);
        this.spriteManager.update(this);
        this.tileManager.update(this);
        
        this.gameWindow.display.clear();
        this.gameWindow.display.save();
        this.contextManager.draw(this, this.gameWindow.display);
        this.gameWindow.display.reset();
        this.gameWindow.display.save();
        this.uiManager.draw(this, this.gameWindow.display);
        this.gameWindow.display.reset();

        if(this.gameWindow.debug) {
            this.gameWindow.drawDebug(this);
        }
    }

    this.client.cursor.events.on(Cursor.EVENT.BUTTON_CLICK, (event) => {
        const { button } = event;

        if(button === Cursor.BUTTON.LEFT) {
            this.uiManager.onClick(event);
        }
    }, { permanent: true });

    this.client.cursor.events.on(Cursor.EVENT.BUTTON_DOWN, ({ button, x, y, radius }) => {
        this.contextManager.onDragStart(button, x, y, radius);
    }, { permanent: true });

    this.client.cursor.events.on(Cursor.EVENT.DRAG, ({ button, deltaX, deltaY }) => {
        this.contextManager.onDragUpdate(button, deltaX, deltaY);
    }, { permanent: true });

    this.client.cursor.events.on(Cursor.EVENT.BUTTON_UP, ({ button }) => {
        this.contextManager.onDragEnd(button);
    }, { permanent: true });
}

ClientGameContext.prototype.onExit = function() {}

ClientGameContext.prototype.exit = function() {
    this.client.exit(this);
    this.world.exit();
    this.contextManager.exit();
    this.spriteManager.exit();
    this.uiManager.exit();
    this.language.exit();
    this.tweenManager.exit();
    this.textureLoader.exit();
    this.dialogueHandler.exit();
    this.onExit();
}