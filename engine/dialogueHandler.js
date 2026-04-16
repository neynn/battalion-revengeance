export const DialogueHandler = function() {
    this.prelogue = [];
    this.postlogue = [];
    this.defeat = [];
    this.state = DialogueHandler.STATE.ENABLED;
    this.skipUnveiling = false;
    this.currentDialogue = [];
    this.currentIndex = -1;
    this.lastIndex = -1;
    this.currentText = "";
    this.fullText = "";
    this.secondsPerLetter = 0.1;
    this.secondsPassed = this.secondsPerLetter;

    this.dialogueID = 0;
    this.lastDialogueID = 0;
}

DialogueHandler.STATE = {
    ENABLED: 0,
    DISABLED: 1
};

DialogueHandler.prototype.update = function(gameContext) {
    const { timer } = gameContext;
    const { deltaTime } = timer;

    if(this.currentDialogue.length !== 0) {
        this.secondsPassed += deltaTime;

        const skippedLetters = Math.floor(this.secondsPassed / this.secondsPerLetter);

        if(skippedLetters > 0) {
            this.revealLetters(skippedLetters);
            this.secondsPassed -= skippedLetters * this.secondsPerLetter;
        }
    }
}

DialogueHandler.prototype.exit = function() {
    this.prelogue = [];
    this.postlogue = [];
    this.defeat = [];
    this.currentDialogue = [];
    this.currentIndex = -1;
    this.lastIndex = -1;
    this.currentText = "";
    this.fullText = "";
    this.secondsPerLetter = 0.1;
    this.secondsPassed = this.secondsPerLetter;
    this.dialogueID = 0;
    this.lastDialogueID = 0;
}

DialogueHandler.prototype.loadMapDialogue = function(prelogue, postlogue, defeat) {
    if(prelogue) {
        this.prelogue = prelogue;
    }

    if(postlogue) {
        this.postlogue = postlogue;
    }

    if(defeat) {
        this.defeat = defeat;
    }
}

DialogueHandler.prototype.disable = function() {
    this.state = DialogueHandler.STATE.DISABLED;
    this.reset();
}

DialogueHandler.prototype.enable = function() {
    this.state = DialogueHandler.STATE.ENABLED;
}

DialogueHandler.prototype.enableUnveiling = function() {
    this.skipUnveiling = false;
}

DialogueHandler.prototype.disableUnveiling = function() {
    this.skipUnveiling = true;
}

DialogueHandler.prototype.playPrelogue = function(gameContext) {
    this.playCustomDialogue(gameContext, this.prelogue);
}

DialogueHandler.prototype.playPostlogue = function(gameContext) {
    this.playCustomDialogue(gameContext, this.postlogue);
}

DialogueHandler.prototype.playDefeat = function(gameContext) {
    this.playCustomDialogue(gameContext, this.defeat);
}

DialogueHandler.prototype.playCustomDialogue = function(gameContext, dialogue) {
    if(dialogue.length !== 0 && this.state !== DialogueHandler.STATE.DISABLED) {
        this.currentIndex = -1;
        this.lastIndex = -1;
        this.currentDialogue = dialogue;
        this.showNextEntry(gameContext);
        this.dialogueID++;
    }
}

DialogueHandler.prototype.hasIndexChanged = function() {
    let hasChanged = false;

    if(this.lastIndex < this.currentIndex) {
        this.lastIndex = this.currentIndex;
        hasChanged = true;
    }

    return hasChanged;
}

DialogueHandler.prototype.hasDialogueChanged = function() {
    let hasChanged = false;

    if(this.lastDialogueID < this.dialogueID) {
        this.lastDialogueID = this.dialogueID;
        hasChanged = true;
    }

    return hasChanged;
}

DialogueHandler.prototype.isFinished = function() {
    return this.currentDialogue.length !== 0 && this.currentIndex >= this.currentDialogue.length;
}

DialogueHandler.prototype.onSkipButton = function() {
    this.reset();
}

DialogueHandler.prototype.onNextButton = function(gameContext) {
    if(this.currentText.length === this.fullText.length) {
        this.showNextEntry(gameContext);
    } else {
        this.showFullText();
    }
}

DialogueHandler.prototype.isUnveiled = function() {
    return this.currentText.length === this.fullText.length;
}

DialogueHandler.prototype.showNextEntry = function(gameContext) {
    this.currentIndex++;

    if(this.isFinished()) {
        this.reset();
        return;
    }

    const { text, voice } = this.currentDialogue[this.currentIndex];
    const { world, client, language } = gameContext;
    const { soundPlayer } = client;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const textID = worldMap.getTextID(text);
    const translation = language.getMapTranslation(textID);

    this.fullText = translation;
    this.currentText = this.skipUnveiling ? translation : "";

    if(voice) {
        soundPlayer.play(voice);
    }
}

DialogueHandler.prototype.showFullText = function() {
    this.currentText = this.fullText;
}

DialogueHandler.prototype.revealLetters = function(letters = 0) {
    while(letters > 0 && this.currentText.length < this.fullText.length) {
        this.currentText += this.fullText[this.currentText.length];
        letters--;
    }
}

DialogueHandler.prototype.reset = function() {
    this.currentDialogue = [];
    this.currentIndex = -1;
    this.lastIndex = -1;
    this.currentPortrait = null;
    this.currentText = "";
    this.fullText = "";
    this.secondsPassed = this.secondsPerLetter;
}