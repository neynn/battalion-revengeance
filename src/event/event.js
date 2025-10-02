import { EntitySpawner } from "../entity/entitySpawner.js";
import { TypeRegistry } from "../type/typeRegistry.js";

export const Event = function(id, next, triggers) {
    this.id = id;
    this.turn = -1;
    this.round = -1;
    this.next = next;
    this.triggers = triggers;
}

Event.prototype.setTriggerTime = function(turn = 1, round = 1) {
    this.turn = turn;
    this.round = round;
}

Event.prototype.trigger = function(gameContext) {
    const { dialogueHandler } = gameContext;

    for(let i = 0; i < this.triggers.length; i++) {
        const { type } = this.trigger[i];

        switch(type) {
            case TypeRegistry.EvENT_TYPE.DIALOGUE: {
                const { dialogue, target } = this.trigger[i];

                dialogueHandler.playDialogue(gameContext, dialogue);
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