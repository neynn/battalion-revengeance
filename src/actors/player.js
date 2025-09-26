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

Player.prototype.onClick = function(gameContext) {
    const tile = ContextHelper.getMouseTile(gameContext);
    const worldMap = gameContext.world.mapManager.getActiveMap();

    console.log(worldMap.getTerrainTags(gameContext, tile.x, tile.y));
    console.log(worldMap.getClimateType(gameContext, tile.x, tile.y))
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

Player.prototype.onTurnStart = function(gameContext) {
    const { world } = gameContext;
    const { entityManager } = world;

    for(const entityID of this.entities) {
        const entity = entityManager.getEntity(entityID);

        if(entity) {
            entity.onTurnStart(gameContext);
            console.log(entity);
        }
    }
}