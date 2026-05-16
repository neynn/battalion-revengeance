import { EffectComponent } from "../../../engine/world/event/effectComponent.js";
import { COMMANDER_TYPE } from "../../enums.js";

export const DialogueComponent = function({ dialogue }) {
    EffectComponent.call(this);

    this.dialogue = dialogue;
}

DialogueComponent.prototype = Object.create(EffectComponent.prototype);
DialogueComponent.prototype.constructor = DialogueComponent;

DialogueComponent.prototype.isFinished = function(gameContext) {
    const { dialogueHandler } = gameContext;

    return !dialogueHandler.hasDialogue();
}

DialogueComponent.prototype.play = function(gameContext) {
    const { dialogueHandler } = gameContext;

    dialogueHandler.playCustomDialogue(gameContext, this.dialogue);
}