import { BattalionEvent } from "./battalionEvent.js";
import { TILE_ID } from "../enums.js";
import { BattalionMap } from "../map/battalionMap.js";
import { playExplosion } from "../systems/animation.js";
import { despawnEntity, spawnClientEntity } from "../systems/spawn.js";

export const ClientBattalionEvent = function(id, actions) {
    BattalionEvent.call(this, id, actions);
}

ClientBattalionEvent.prototype = Object.create(BattalionEvent.prototype);
ClientBattalionEvent.prototype.constructor = ClientBattalionEvent;

ClientBattalionEvent.prototype.playDialogue = function(gameContext, dialogue, target) {
    //Get team from target -> get actor -> call onDialogue.
}

ClientBattalionEvent.prototype.onDialogue = function(gameContext, action) {
    const { dialogueHandler } = gameContext;
    const { dialogue, target } = action;

    if(target) {
        this.playDialogue(gameContext, dialogue, target);
    } else {
        dialogueHandler.playCustomDialogue(gameContext, dialogue);
    }
}

ClientBattalionEvent.prototype.onTileExplode = function(gameContext, action) {
    const { world } = gameContext;
    const { mapManager } = world;
    const { layer, x, y } = action;
    const worldMap = mapManager.getActiveMap();
    const index = BattalionMap.getLayerIndex(layer);
    const entity = world.getEntityAt(x, y);

    worldMap.editTile(index, x, y, TILE_ID.NONE);
    worldMap.removeLocalization(x, y);

    if(entity !== null) {
        despawnEntity(gameContext, entity);
    }

    playExplosion(gameContext, x, y);
}

ClientBattalionEvent.prototype.onSpawn = function(gameContext, action) {
    const { setup } = action;

    spawnClientEntity(gameContext, setup);
}