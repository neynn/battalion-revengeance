import { Cursor } from "./cursor/cursor.js";
import { Keyboard } from "./keyboard.js";
import { Socket } from "../network/socket.js";
import { SoundPlayer } from "./sound/soundPlayer.js";
import { InputRouter } from "./inputRouter.js";
import { MusicPlayer } from "./music/musicPlayer.js";
import { MouseButton } from "./cursor/mouseButton.js";
import { Session } from "./session.js";

export const Client = function() {
    this.router = new InputRouter();
    this.keyboard = new Keyboard();
    this.session = new Session();
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
        this.router.handleInput(InputRouter.PREFIX.DOWN, Client.BUTTON_TABLE[button]);
    }, { permanent: true });

    this.cursor.events.on(Cursor.EVENT.BUTTON_CLICK, ({ button }) => {
        this.router.handleInput(InputRouter.PREFIX.UP, Client.BUTTON_TABLE[button]);
    }, { permanent: true });
}

Client.BUTTON_TABLE = [
    InputRouter.CURSOR_INPUT.M1,
    InputRouter.CURSOR_INPUT.M3,
    InputRouter.CURSOR_INPUT.M2,
    InputRouter.CURSOR_INPUT.M1,
    InputRouter.CURSOR_INPUT.M1
];

Client.prototype.exit = function(gameContext) {
    this.router.clear(gameContext);
    this.keyboard.exit();
    this.cursor.events.muteAll();
    this.socket.events.muteAll();
    this.musicPlayer.exit();
    this.soundPlayer.exit();
    this.session.exit();
}

Client.prototype.update = function() {
    this.musicPlayer.update();

    for(const key of this.keyboard.activeKeys) {
        this.router.handleInput(InputRouter.PREFIX.HOLD, key);
    }

    for(let i = 0; i < this.cursor.buttons.length; i++) {
        const button = this.cursor.buttons[i];

        button.update();

        if(button.flags & MouseButton.FLAG.HELD) {
            this.router.handleInput(InputRouter.PREFIX.HOLD, Client.BUTTON_TABLE[i]);
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