import { COMMANDER_TYPE } from "../enums.js";

export const DialogueHandler = function() {
    this.prelogue = [];
    this.postlogue = [];
    this.defeat = [];
    this.state = DialogueHandler.STATE.ENABLED;
    this.skipUnveiling = false;
    this.currentDialogue = [];
    this.currentIndex = -1;
    this.currentPortrait = null;
    this.currentName = "";
    this.currentText = "";
    this.fullCurrentText = "";
    this.secondsPerLetter = 0.1;
    this.secondsPassed = this.secondsPerLetter;
}

DialogueHandler.STATE = {
    ENABLED: 0,
    DISABLED: 1
};

DialogueHandler.TYPE = {
    PRELOGUE: 0,
    POSTLOGUE: 1,
    DEFEAT: 2
};

DialogueHandler.prototype.update = function(gameContext, deltaTime) {
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
    this.currentPortrait = null;
    this.currentName = "";
    this.currentText = "";
    this.fullCurrentText = "";
    this.secondsPerLetter = 0.1;
    this.secondsPassed = this.secondsPerLetter;
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

DialogueHandler.prototype.playDialogue = function(gameContext, type) {    
    switch(type) {
        case DialogueHandler.TYPE.PRELOGUE: {
            this.playCustomDialogue(gameContext, this.prelogue);
            break;
        }
        case DialogueHandler.TYPE.POSTLOGUE: {
            this.playCustomDialogue(gameContext, this.postlogue);
            break;
        }
        case DialogueHandler.TYPE.DEFEAT: {
            this.playCustomDialogue(gameContext, this.defeat);
            break;
        }
        default: {
            console.error("Invalid dialogue type!");
            break;
        }
    }
}

DialogueHandler.prototype.playCustomDialogue = function(gameContext, dialogue) {
    if(dialogue.length !== 0 && this.state !== DialogueHandler.STATE.DISABLED) {
        this.currentIndex = -1;
        this.currentDialogue = dialogue;
        this.showNextEntry(gameContext);
    }
}

DialogueHandler.prototype.isFinished = function() {
    return this.currentDialogue.length !== 0 && this.currentIndex >= this.currentDialogue.length;
}

DialogueHandler.prototype.onSkipButton = function() {
    this.reset();
}

DialogueHandler.prototype.onNextButton = function(gameContext) {
    if(this.currentText.length === this.fullCurrentText.length) {
        this.showNextEntry(gameContext);
    } else {
        this.showFullText();
    }
}

DialogueHandler.prototype.showNextEntry = function(gameContext) {
    this.currentIndex++;

    if(this.isFinished()) {
        this.reset();
        return;
    }

    const { client, language, portraitHandler, typeRegistry } = gameContext;
    const { soundPlayer } = client;
    const { narrator, text, voice } = this.currentDialogue[this.currentIndex];
    const translation = language.getMapTranslation(text);

    const commanderID = COMMANDER_TYPE[narrator] ?? COMMANDER_TYPE.NONE;
    const { portrait, name } = typeRegistry.getCommanderType(commanderID);
    const portraitTexture = portraitHandler.getPortraitTexture(portrait);
    const nameTranslation = language.getSystemTranslation(name);

    this.currentName = nameTranslation;
    this.currentPortrait = portraitTexture;
    this.fullCurrentText = translation;
    this.currentText = this.skipUnveiling ? translation : "";

    if(voice) {
        soundPlayer.play(voice);
    }
}

DialogueHandler.prototype.showFullText = function() {
    this.currentText = this.fullCurrentText;
}

DialogueHandler.prototype.revealLetters = function(letters = 0) {
    while(letters > 0 && this.currentText.length < this.fullCurrentText.length) {
        this.currentText += this.fullCurrentText[this.currentText.length];
        letters--;
    }
}

DialogueHandler.prototype.reset = function() {
    this.currentDialogue = [];
    this.currentIndex = -1;
    this.currentPortrait = null;
    this.currentName = "";
    this.currentText = "";
    this.fullCurrentText = "";
    this.secondsPassed = this.secondsPerLetter;
}