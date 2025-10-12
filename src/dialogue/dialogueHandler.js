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
    DEFEAT: 2
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
}

DialogueHandler.prototype.play = function(gameContext, type) {
    switch(type) {
        case DialogueHandler.TYPE.PRELOGUE: {
            this.playDialogue(gameContext, this.prelogue);
            break;
        }
        case DialogueHandler.TYPE.POSTLOGUE: {
            this.playDialogue(gameContext, this.postlogue);
            break;
        }
        case DialogueHandler.TYPE.DEFEAT: {
            this.playDialogue(gameContext, this.defeat);
            break;
        }
        default: {
            break;
        }
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

DialogueHandler.prototype.showNextEntry = function(gameContext) {
    this.currentIndex++;

    if(this.currentIndex >= this.currentDialogue.length) {
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

DialogueHandler.prototype.advanceLetter = function() {
    if(this.currentText.length < this.fullCurrentText.length) {
        this.currentText += this.fullCurrentText[this.currentText.length];
    }
}

DialogueHandler.prototype.reset = function() {
    this.currentDialogue = [];
    this.currentIndex = -1;
    this.currentPortrait = null;
    this.currentName = "";
    this.currentText = "";
    this.fullCurrentText = "";
}