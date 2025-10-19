import { ActionHelper } from "../action/actionHelper.js";
import { DialogueHandler } from "../dialogue/dialogueHandler.js";
import { EntitySpawner } from "../entity/entitySpawner.js";
import { TypeRegistry } from "../type/typeRegistry.js";

export const Event = function(id, next, triggers) {
    this.id = id;
    this.turn = -1;
    this.round = -1;
    this.next = next;
    this.triggers = triggers;
}

Event.prototype.setTriggerTime = function(turn = -1, round = -1) {
    this.turn = turn;
    this.round = round;
}

Event.prototype.triggerByTurn = function(gameContext, turn) {
    if(this.turn !== -1 && turn >= this.turn) {
        this.trigger(gameContext);
    }
}

Event.prototype.triggerByRound = function(gameContext, round) {
    if(this.round !== -1 && round >= this.round) {
        this.trigger(gameContext);
    }
}

Event.prototype.trigger = function(gameContext) {
    for(let i = 0; i < this.triggers.length; i++) {
        const { type } = this.triggers[i];

        switch(type) {
            case TypeRegistry.EVENT_TYPE.DIALOGUE: {
                const { dialogue, target } = this.triggers[i];

                ActionHelper.createCustomDialogue(gameContext, dialogue);
                break;
            }
            case TypeRegistry.EVENT_TYPE.EXPLODE_TILE: {
                const { layer, x, y } = this.triggers[i];
                //Play explode sfx and set tile x y at layer l to 0.
                break;
            }
            case TypeRegistry.EVENT_TYPE.SPAWN_ENTITY: {
                const { setup } = this.triggers[i];

                EntitySpawner.loadEntity(gameContext, setup, null);
                break; 
            }
        }
    }
}