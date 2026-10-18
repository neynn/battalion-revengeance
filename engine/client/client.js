import { Cursor } from "./cursor/cursor.js";
import { Keyboard } from "./keyboard.js";
import { Socket } from "../network/socket.js";
import { SoundPlayer } from "./sound/soundPlayer.js";
import { InputRouter } from "./inputRouter.js";
import { MusicPlayer } from "./music/musicPlayer.js";

export const Client = function() {
    this.router = new InputRouter();
    this.keyboard = new Keyboard();
    this.cursor = new Cursor();
    this.socket = new Socket();
    this.musicPlayer = new MusicPlayer();
    this.soundPlayer = new SoundPlayer();
}

Client.prototype.exit = function(gameContext) {
    this.router.clear(gameContext);
    this.keyboard.exit();
    this.cursor.events.muteAll();
    this.socket.events.muteAll();
    this.musicPlayer.exit();
    this.soundPlayer.exit();
}

Client.prototype.update = function() {
    this.musicPlayer.update();
    this.cursor.update();
    this.router.updateTriggers(this.keyboard, this.cursor);
}

Client.prototype.updateLate = function() {
    this.keyboard.updateKeyStates();
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