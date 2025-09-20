import { ContextHelper } from "../../engine/camera/contextHelper.js";
import { Actor } from "../../engine/turn/actor.js";

export const Player = function(id, config) {
    Actor.call(this, id);

    this.config = config;
    this.camera = null;
}

Player.ACTION = {
    CLICK: "CLICK"
};

Player.prototype = Object.create(Actor.prototype);
Player.prototype.constructor = Player;

Player.prototype.onClick = function(gameContext) {
    const tile = ContextHelper.getMouseTile(gameContext);

    console.log(tile);
}

Player.prototype.loadKeybinds = function(gameContext) {
    const { client } = gameContext;
    const { router } = client;
    
    router.bind(gameContext, "PLAY");
    router.on(Player.ACTION.CLICK, () => this.onClick(gameContext));
}

Player.prototype.setCamera = function(camera) {
    this.camera = camera;
}