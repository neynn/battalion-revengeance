import { BattalionEvent } from "./battalionEvent.js";
import { spawnClientEntity } from "../systems/spawn.js";
import { createTileExplodeIntent } from "../action/actionHelper.js";

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
    const { actionRouter } = gameContext;
    const { layer, x, y } = action;
    const actionIntent = createTileExplodeIntent(layer, x, y);

    actionRouter.forceEnqueue(gameContext, actionIntent);
}

ClientBattalionEvent.prototype.onSpawn = function(gameContext, action) {
    const { setup } = action;
    
    spawnClientEntity(gameContext, setup);
}