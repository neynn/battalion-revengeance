import { Cursor } from "./cursor.js";
import { Keyboard } from "./keyboard.js";
import { Socket } from "../network/socket.js";
import { SoundPlayer } from "./sound/soundPlayer.js";
import { InputRouter } from "./inputRouter.js";
import { MusicPlayer } from "./music/musicPlayer.js";
import { MouseButton } from "./mouseButton.js";

export const Client = function() {
    this.router = new InputRouter();
    this.keyboard = new Keyboard();
    this.cursor = new Cursor();
    this.socket = new Socket();
    this.musicPlayer = new MusicPlayer();
    this.soundPlayer = new SoundPlayer();

    this.keyboard.events.on(Keyboard.EVENT.KEY_PRESSED, ({ key }) => {
        this.router.handleInput(InputRouter.PREFIX.DOWN, key);
    }, { permanent: true });

    this.keyboard.events.on(Keyboard.EVENT.KEY_RELEASED, ({ key }) => {
        this.router.handleInput(InputRouter.PREFIX.UP, key);
    }, { permanent: true });

    this.cursor.events.on(Cursor.EVENT.BUTTON_DOWN, ({ button }) => {
        this.router.handleInput(InputRouter.PREFIX.DOWN, Client.BUTTON_MAP[button]);
    }, { permanent: true });

    this.cursor.events.on(Cursor.EVENT.BUTTON_CLICK, ({ button }) => {
        this.router.handleInput(InputRouter.PREFIX.UP, Client.BUTTON_MAP[button]);
    }, { permanent: true });

    this.cursor.events.on(Cursor.EVENT.BUTTON_HOLD, ({ button }) => {
        this.router.handleInput(InputRouter.PREFIX.HOLD, Client.BUTTON_MAP[button]);
    }, { permanent: true });
}

Client.BUTTON_MAP = {
    [Cursor.BUTTON.LEFT]: InputRouter.CURSOR_INPUT.M1,
    [Cursor.BUTTON.MIDDLE]: InputRouter.CURSOR_INPUT.M3,
    [Cursor.BUTTON.RIGHT]: InputRouter.CURSOR_INPUT.M2,
    [Cursor.BUTTON.MOUSE_4]: InputRouter.CURSOR_INPUT.M1,
    [Cursor.BUTTON.MOUSE_5]: InputRouter.CURSOR_INPUT.M1
};

Client.prototype.exit = function(gameContext) {
    this.router.clear(gameContext);
    this.keyboard.exit();
    this.cursor.events.muteAll();
    this.socket.events.muteAll();
    this.musicPlayer.stop();
    this.soundPlayer.exit();
}

Client.prototype.update = function() {
    for(const key of this.keyboard.activeKeys) {
        this.router.handleInput(InputRouter.PREFIX.HOLD, key);
    }

    for(let i = 0; i < this.cursor.buttons.length; i++) {
        const button = this.cursor.buttons[i];

        if(button.state !== MouseButton.STATE.UP) {
            this.router.handleInput(InputRouter.PREFIX.HOLD, Client.BUTTON_MAP[i]);
        }
    }
}

Client.prototype.isOnline = function() {
    if(!this.socket.isConnected) {
        return false;
    }

    if(!this.socket.socket) {
        return false;
    }

    return true;
}