const DEFAULT_LETTERS_PER_SECOND = 20;

export const DialogueHandler = function() {
    this.prelogue = [];
    this.postlogue = [];
    this.defeat = [];
    this.state = DialogueHandler.STATE.ENABLED;
    this.currentDialogue = [];
    this.currentIndex = -1;
    this.lastIndex = -1;
    this.fullText = "";
    
    this.skipUnveiling = false;
    this.lettersPerSecond = DEFAULT_LETTERS_PER_SECOND;
    this.secondsPassed = 0;

    this.dialogueID = 0;
    this.lastDialogueID = 0;

    this.letterCount = 0;
    this.letterIndex = 0;
}

DialogueHandler.STATE = {
    ENABLED: 0,
    DISABLED: 1
};

DialogueHandler.prototype.update = function(gameContext) {
    const { timer } = gameContext;
    const { deltaTime } = timer;

    if(this.currentDialogue.length !== 0) {
        if(this.skipUnveiling) {
            this.letterIndex = this.letterCount;
        } else if(this.letterIndex !== this.letterCount) {
            this.secondsPassed += deltaTime;
            this.letterIndex = Math.floor(this.secondsPassed * this.lettersPerSecond);

            if(this.letterIndex >= this.letterCount) {
                this.letterIndex = this.letterCount;
            }
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
    this.fullText = "";
    
    this.lettersPerSecond = DEFAULT_LETTERS_PER_SECOND;
    this.secondsPassed = 0;
    
    this.dialogueID = 0;
    this.lastDialogueID = 0;
    
    this.letterCount = 0;
    this.letterIndex = 0;
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
        this.dialogueID++;
        this.currentDialogue = dialogue;
        this.showNextEntry(gameContext);
    }
}

DialogueHandler.prototype.hasEntryChanged = function() {
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


DialogueHandler.prototype.getCurrentEntry = function() {
    if(this.currentIndex < 0 || this.currentIndex >= this.currentDialogue.length) {
        return null;
    }

    return this.currentDialogue[this.currentIndex];
}

DialogueHandler.prototype.isFinished = function() {
    return this.currentDialogue.length !== 0 && this.currentIndex >= this.currentDialogue.length;
}

DialogueHandler.prototype.onSkipButton = function() {
    this.reset();
}

DialogueHandler.prototype.onNextButton = function(gameContext) {
    if(this.letterIndex === this.letterCount) {
        this.showNextEntry(gameContext);
    } else {
        this.letterIndex = this.letterCount;
    }
}

DialogueHandler.prototype.setLetterCount = function(count) {
    this.letterIndex = 0;
    this.secondsPassed = 0;
    this.letterCount = count;
}

DialogueHandler.prototype.isUnveiled = function() {
    return this.letterCount === this.letterIndex;
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

    if(voice) {
        soundPlayer.play(voice);
    }
}

DialogueHandler.prototype.reset = function() {
    this.currentDialogue = [];
    this.currentIndex = -1;
    this.lastIndex = -1;
    this.fullText = "";
    this.secondsPassed = 0;
    this.letterCount = 0;
    this.letterIndex = 0;
}