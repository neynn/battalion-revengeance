import { Actor } from "../../engine/turn/actor.js";

export const Player = function(id, config) {
    Actor.call(this, id);

    this.config = config;
    this.camera = null;
}

Player.prototype = Object.create(Actor.prototype);
Player.prototype.constructor = Player;

Player.prototype.loadKeybinds = function(gameContext) {
    const { client } = gameContext;
    const { router } = client;
    
    router.bind(gameContext, "PLAY");
}

Player.prototype.setCamera = function(camera) {
    this.camera = camera;
}