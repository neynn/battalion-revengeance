import { EventComponent } from "../../../engine/world/event/eventComponent.js";

export const ClientDialogueComponent = function(dialogue, target) {
    EventComponent.call(this);

    this.dialogue = dialogue;
    this.target = target;
}

ClientDialogueComponent.prototype = Object.create(EventComponent.prototype);
ClientDialogueComponent.prototype.constructor = ClientDialogueComponent;

ClientDialogueComponent.prototype.execute = function(gameContext) {
    const { dialogueHandler } = gameContext;

    if(this.target) {
        //Get team from target -> get actor -> call onDialogue.
    } else {
        dialogueHandler.playCustomDialogue(gameContext, this.dialogue);
    }
}