import { LanguageHandler } from "../../engine/language/languageHandler.js";
import { TypeRegistry } from "../type/typeRegistry.js";

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
}

DialogueHandler.STATE = {
    ENABLED: 0,
    DISABLED: 1
};

DialogueHandler.TYPE = {
    PRELOGUE: 0,
    POSTLOGUE: 1,
    DEFEAT: 2,
    CUSTOM: 3
};

DialogueHandler.prototype.loadPrelogue = function(prelogue) {
    this.prelogue = prelogue;
}

DialogueHandler.prototype.loadPostlogue = function(postlogue) {
    this.postlogue = postlogue;
}

DialogueHandler.prototype.loadDefeat = function(defeat) {
    this.defeat = defeat;
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
}

DialogueHandler.prototype.getDialogue = function(type) {
    switch(type) {
        case DialogueHandler.TYPE.PRELOGUE: return this.prelogue;
        case DialogueHandler.TYPE.POSTLOGUE: return this.postlogue;
        case DialogueHandler.TYPE.DEFEAT: return this.defeat;
        default: return [];
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

DialogueHandler.prototype.playDialogue = function(gameContext, dialogue) {
    if(dialogue.length !== 0 && this.state !== DialogueHandler.STATE.DISABLED) {
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
    const translation = language.get(text, LanguageHandler.TAG_TYPE.MAP);
    const commanderType = typeRegistry.getType(narrator, TypeRegistry.CATEGORY.COMMANDER);

    if(commanderType) {
        const { portrait, name } = commanderType;
        const portraitTexture = portraitHandler.getPortraitTexture(portrait);
        const nameTranslation = language.get(name);

        this.currentName = nameTranslation;
        this.currentPortrait = portraitTexture;
    } else {
        this.currentName = "";
        this.currentPortrait = null;
    }

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

DialogueHandler.prototype.isEnabled = function() {
    return this.state === DialogueHandler.STATE.ENABLED;
}

DialogueHandler.prototype.reset = function() {
    this.currentDialogue = [];
    this.currentIndex = -1;
    this.currentPortrait = null;
    this.currentName = "";
    this.currentText = "";
    this.fullCurrentText = "";
}