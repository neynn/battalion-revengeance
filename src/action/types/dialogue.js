import { Action } from "../../../engine/action/action.js";
import { DialogueHandler } from "../../dialogue/dialogueHandler.js";

export const DialogueAction = function() {
    Action.call(this);

    this.secondsPerLetter = 0.1;
    this.secondsPassed = this.secondsPerLetter;
}

DialogueAction.prototype = Object.create(Action.prototype);
DialogueAction.prototype.constructor = DialogueAction;

DialogueAction.prototype.onStart = function(gameContext, data, id) {
    const { dialogueHandler } = gameContext;
    const { dialogue } = data;

    dialogueHandler.playDialogue(gameContext, dialogue);
}

DialogueAction.prototype.onUpdate = function(gameContext, data, id) {
    const { timer, dialogueHandler } = gameContext;
    const fixedDeltaTime = timer.getFixedDeltaTime();

    this.secondsPassed += fixedDeltaTime;

    const skippedLetters = Math.floor(this.secondsPassed / this.secondsPerLetter);

    if(skippedLetters > 0) {
        dialogueHandler.revealLetters(skippedLetters);
        this.secondsPassed -= skippedLetters * this.secondsPerLetter;
    }
}

DialogueAction.prototype.isFinished = function(gameContext, executionRequest) {
    const { dialogueHandler } = gameContext;

    return dialogueHandler.isFinished();
}

DialogueAction.prototype.onEnd = function(gameContext, data, id) {
    this.secondsPassed = this.secondsPerLetter;
}

DialogueAction.prototype.validate = function(gameContext, executionRequest, requestData) {
    const { dialogueHandler } = gameContext;
    const { type, dialogue } = requestData;

    if(!dialogueHandler.isEnabled()) {
        return;
    }

    let dialogueList = null;

    if(type === DialogueHandler.TYPE.CUSTOM) {
        dialogueList = dialogue;
    } else {
        dialogueList = dialogueHandler.getDialogue(type);
    }

    if(dialogueList && dialogueList.length > 0) {
        executionRequest.setData({
            "dialogue": dialogueList
        });
    }
}