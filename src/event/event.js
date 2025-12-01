import { EntityHelper } from "../../engine/util/entityHelper.js";
import { ActionHelper } from "../action/actionHelper.js";
import { BattalionMap } from "../map/battalionMap.js";
import { playExplosion } from "../systems/animation.js";
import { despawnEntity, spawnEntity } from "../systems/spawn.js";
import { TypeRegistry } from "../type/typeRegistry.js";

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

    worldMap.clearTile(index, tileX, tileY);

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
            case TypeRegistry.EVENT_TYPE.DIALOGUE: {
                const { dialogue, target } = this.actions[i];

                ActionHelper.createCustomDialogue(gameContext, dialogue);
                break;
            }
            case TypeRegistry.EVENT_TYPE.EXPLODE_TILE: {
                const { layer, x, y } = this.actions[i];

                this.explodeTile(gameContext, layer, x, y);
                break;
            }
            case TypeRegistry.EVENT_TYPE.SPAWN_ENTITY: {
                const { setup } = this.actions[i];

                spawnEntity(gameContext, setup);
                break; 
            }
        }
    }
}