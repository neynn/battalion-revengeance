import { EntityHelper } from "../../engine/util/entityHelper.js";
import { EVENT_TYPE, TILE_ID } from "../enums.js";
import { BattalionMap } from "../map/battalionMap.js";
import { playExplosion } from "../systems/animation.js";
import { despawnEntity, spawnEntityFromJSON } from "../systems/spawn.js";

export const Event = function(id, actions) {
    this.id = id;
    this.turn = Event.INVALID_TIME;
    this.round = Event.INVALID_TIME;
    this.next = null;
    this.actions = actions;
    this.isTriggered = false; 
}

Event.INVALID_TIME = -1;

Event.prototype.setNext = function(next) {
    if(next !== undefined && next !== this.id) {
        this.next = next;
    }
}

Event.prototype.setTriggerTime = function(turn = Event.INVALID_TIME, round = Event.INVALID_TIME) {
    this.turn = turn;
    this.round = round;
}

Event.prototype.explodeTile = function(gameContext, layerName, tileX, tileY) {
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

Event.prototype.trigger = function(gameContext) {
    this.isTriggered = true;

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