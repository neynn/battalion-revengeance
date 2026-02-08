import { EventComponent } from "../../../engine/world/event/eventComponent.js";

export const DialogueComponent = function(dialogue, target) {
    EventComponent.call(this);

    this.dialogue = dialogue;
    this.target = target;
}

DialogueComponent.prototype = Object.create(EventComponent.prototype);
DialogueComponent.prototype.constructor = DialogueComponent;

DialogueComponent.prototype.execute = function(gameContext) {
    const { dialogueHandler } = gameContext;

    if(this.target) {
        //Get team from target -> get actor -> call onDialogue.
    } else {
        dialogueHandler.playCustomDialogue(gameContext, this.dialogue);
    }
}