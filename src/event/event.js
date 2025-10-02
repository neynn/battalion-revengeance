import { EntitySpawner } from "../entity/entitySpawner.js";
import { TypeRegistry } from "../type/typeRegistry.js";

export const Event = function(id, turn, next, triggers) {
    this.id = id;
    this.turn = turn;
    this.next = next;
    this.triggers = triggers;
}

Event.prototype.trigger = function(gameContext) {
    for(let i = 0; i < this.triggers.length; i++) {
        const { type } = this.trigger[i];

        switch(type) {
            case TypeRegistry.EvENT_TYPE.DIALOGUE: {
                const { dialogue, targer } = this.trigger[i];
                //Play dialogue if the target if the clients actors.
                break;
            }
            case TypeRegistry.EvENT_TYPE.EXPLODE_TILE: {
                const { layer, x, y } = this.trigger[i];
                //Play explode sfx and set tile x y at layer l to 0.
                break;
            }
            case TypeRegistry.EvENT_TYPE.SPAWN_ENTITY: {
                const { setup } = this.trigger[i];

                EntitySpawner.loadEntity(gameContext, setup, null);
                break; 
            }
        }
    }
}