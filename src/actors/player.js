import { ContextHelper } from "../../engine/camera/contextHelper.js";
import { BattalionActor } from "./battalionActor.js";

export const Player = function(id, config) {
    BattalionActor.call(this, id);

    this.config = config;
    this.camera = null;
}

Player.ACTION = {
    CLICK: "CLICK"
};

Player.prototype = Object.create(BattalionActor.prototype);
Player.prototype.constructor = Player;

Player.prototype.setCamera = function(camera) {
    this.camera = camera;
}

Player.prototype.onClick = function(gameContext) {
    const tile = ContextHelper.getMouseTile(gameContext);
    const worldMap = gameContext.world.mapManager.getActiveMap();
    const test = {
        "terrain": worldMap.getTerrainTags(gameContext, tile.x, tile.y),
        "climate": worldMap.getClimateType(gameContext, tile.x, tile.y),
        "type": worldMap.getTileType(gameContext, tile.x, tile.y),
        "x": tile.x,
        "y": tile.y
    }

    console.log(test);
}

Player.prototype.loadKeybinds = function(gameContext) {
    const { client } = gameContext;
    const { router } = client;
    
    router.bind(gameContext, "PLAY");
    router.on(Player.ACTION.CLICK, () => this.onClick(gameContext));
}

Player.prototype.activeUpdate = function(gameContext, remainingActions) {}