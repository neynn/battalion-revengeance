import { EntityHelper } from "../engine/util/entityHelper.js";
import { WorldEvent } from "../engine/world/event/worldEvent.js"
import { EVENT_TYPE, TILE_ID } from "./enums.js";
import { BattalionMap } from "./map/battalionMap.js";
import { playExplosion } from "./systems/animation.js";
import { despawnEntity, spawnEntityFromJSON } from "./systems/spawn.js";

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
    const entity = EntityHelper.getTileEntity(gameContext, tileX, tileY);

    worldMap.editTile(index, tileX, tileY, TILE_ID.NONE);
    worldMap.removeLocalization(tileX, tileY);

    if(entity !== null) {
        despawnEntity(gameContext, entity);
    }

    playExplosion(gameContext, tileX, tileY);
}

BattalionEvent.prototype.execute = function(gameContext) {
    for(let i = 0; i < this.actions.length; i++) {
        const { type } = this.actions[i];

        switch(type) {
            case EVENT_TYPE.DIALOGUE: {
                const { dialogue, target } = this.actions[i];
                //TODO: Open dialogue UI.
                //ActionHelper.createCustomDialogue(gameContext, dialogue);
                break;
            }
            case EVENT_TYPE.EXPLODE_TILE: {
                const { layer, x, y } = this.actions[i];

                this.explodeTile(gameContext, layer, x, y);
                break;
            }
            case EVENT_TYPE.SPAWN_ENTITY: {
                const { setup } = this.actions[i];

                spawnEntityFromJSON(gameContext, setup);
                break; 
            }
        }
    }
}