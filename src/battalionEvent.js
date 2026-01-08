import { WorldEvent } from "../engine/world/event/worldEvent.js"
import { EVENT_TYPE, TILE_ID } from "./enums.js";
import { BattalionMap } from "./map/battalionMap.js";
import { playExplosion } from "./systems/animation.js";
import { despawnEntity, spawnEntity } from "./systems/spawn.js";

export const BattalionEvent = function(id, actions) {
    WorldEvent.call(this, id, actions);
}

BattalionEvent.prototype = Object.create(WorldEvent.prototype);
BattalionEvent.prototype.constructor = BattalionEvent;

BattalionEvent.prototype.explodeTile = function(gameContext, layerName, tileX, tileY) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const index = BattalionMap.getLayerIndex(layerName);
    const entity = world.getEntityAt(tileX, tileY);

    worldMap.editTile(index, tileX, tileY, TILE_ID.NONE);
    worldMap.removeLocalization(tileX, tileY);

    if(entity !== null) {
        despawnEntity(gameContext, entity);
    }

    playExplosion(gameContext, tileX, tileY);
}

BattalionEvent.prototype.playDialogue = function(gameContext, dialogue, target) {
    //get team from target -> get actor -> call onDialogue.
}

BattalionEvent.prototype.broadcastDialogue = function(gameContext, dialogue) {
    const { dialogueHandler } = gameContext;

    dialogueHandler.playCustomDialogue(gameContext, dialogue);
}

BattalionEvent.prototype.execute = function(gameContext) {
    for(let i = 0; i < this.actions.length; i++) {
        const { type } = this.actions[i];

        switch(type) {
            case EVENT_TYPE.DIALOGUE: {
                const { dialogue, target } = this.actions[i];

                if(target) {
                    this.playDialogue(gameContext, dialogue, target);
                } else {
                    this.broadcastDialogue(gameContext, dialogue);
                }

                break;
            }
            case EVENT_TYPE.EXPLODE_TILE: {
                const { layer, x, y } = this.actions[i];
                this.explodeTile(gameContext, layer, x, y);
                break;
            }
            case EVENT_TYPE.SPAWN_ENTITY: {
                const { setup } = this.actions[i];
                spawnEntity(gameContext, setup);
                break; 
            }
        }
    }
}