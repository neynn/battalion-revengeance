import { EffectComponent } from "../../../engine/world/event/effectComponent.js";

export const DialogueComponent = function(dialogue) {
    EffectComponent.call(this);

    this.dialogue = dialogue;
}

DialogueComponent.prototype = Object.create(EffectComponent.prototype);
DialogueComponent.prototype.constructor = DialogueComponent;

DialogueComponent.prototype.isFinished = function(gameContext) {
    //console.log("REEEE");

    return false;
}

DialogueComponent.prototype.play = function(gameContext) {
    const { dialogueHandler } = gameContext;

    dialogueHandler.playCustomDialogue(gameContext, this.dialogue);
}