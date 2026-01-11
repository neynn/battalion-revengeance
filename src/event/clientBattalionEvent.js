import { BattalionEvent } from "./battalionEvent.js";
import { createSpawnIntent, createTileExplodeIntent } from "../action/actionHelper.js";
import { EFFECT_TYPE } from "../enums.js";
import { playExplosion, playGFX } from "../systems/animation.js";
import { playSFX } from "../systems/sound.js";

export const ClientBattalionEvent = function(id, actions) {
    BattalionEvent.call(this, id, actions);
}

ClientBattalionEvent.prototype = Object.create(BattalionEvent.prototype);
ClientBattalionEvent.prototype.constructor = ClientBattalionEvent;

ClientBattalionEvent.prototype.onPlayEffect = function(gameContext, action) {
    const { effects } = action;

    for(const effect of effects) {
        switch(effect.type) {
            case EFFECT_TYPE.EXPLOSION: {
                playExplosion(gameContext, effect.x, effect.y);
                break;
            }
            case EFFECT_TYPE.SFX: {
                playSFX(gameContext, effect.sfx);
                break;
            }
            case EFFECT_TYPE.GFX: {
                playGFX(gameContext, effect.gfx, effect.x, effect.y);
                break;
            }
            default: {
                console.warn("Unknown effect type", effect.type);
                break;
            }
        }
    }
}

ClientBattalionEvent.prototype.onDialogue = function(gameContext, action) {
    const { dialogueHandler } = gameContext;
    const { dialogue, target } = action;

    if(target) {
        //Get team from target -> get actor -> call onDialogue.
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
    const { actionRouter } = gameContext;
    const { entities } = action;
    const actionIntent = createSpawnIntent(entities);

    actionRouter.forceEnqueue(gameContext, actionIntent);
}