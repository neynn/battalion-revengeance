import { BattalionEvent } from "./battalionEvent.js";
import { TILE_ID } from "../enums.js";
import { BattalionMap } from "../map/battalionMap.js";
import { despawnEntity, spawnEntity } from "../systems/spawn.js";

export const ServerBattalionEvent = function(id, actions) {
    BattalionEvent.call(this, id, actions);
}

ServerBattalionEvent.prototype = Object.create(BattalionEvent.prototype);
ServerBattalionEvent.prototype.constructor = ServerBattalionEvent;

ServerBattalionEvent.prototype.onTileExplode = function(gameContext, action) {
    const { world } = gameContext;
    const { mapManager } = world;
    const { layer, x, y } = action;
    const worldMap = mapManager.getActiveMap();
    const index = BattalionMap.getLayerIndex(layer);
    const entity = world.getEntityAt(x, y);

    worldMap.editTile(index, x, y, TILE_ID.NONE);

    if(entity !== null) {
        despawnEntity(gameContext, entity);
    }
}

ServerBattalionEvent.prototype.onSpawn = function(gameContext, action) {
    const { setup } = action;

    spawnEntity(gameContext, setup);
}