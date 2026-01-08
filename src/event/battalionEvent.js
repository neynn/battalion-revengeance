import { WorldEvent } from "../../engine/world/event/worldEvent.js"
import { EVENT_TYPE } from "../enums.js";

export const BattalionEvent = function(id, actions) {
    WorldEvent.call(this, id, actions);
}

BattalionEvent.prototype = Object.create(WorldEvent.prototype);
BattalionEvent.prototype.constructor = BattalionEvent;

BattalionEvent.prototype.onDialogue = function(gameContext, action) {}
BattalionEvent.prototype.onTileExplode = function(gameContext, action) {}
BattalionEvent.prototype.onSpawn = function(gameContext, action) {}

BattalionEvent.prototype.execute = function(gameContext) {
    for(let i = 0; i < this.actions.length; i++) {
        const { type } = this.actions[i];

        switch(type) {
            case EVENT_TYPE.DIALOGUE: {
                this.onDialogue(gameContext, this.actions[i]);
                break;
            }
            case EVENT_TYPE.EXPLODE_TILE: {
                this.onTileExplode(gameContext, this.actions[i]);
                break;
            }
            case EVENT_TYPE.SPAWN_ENTITY: {
                this.onSpawn(gameContext, this.actions[i]);
                break; 
            }
        }
    }
}