import { LanguageHandler } from "../../engine/language/languageHandler.js";

export const DialogueHandler = function() {
    this.prelogue = [];
    this.postlogue = [];
    this.defeat = [];
    this.state = DialogueHandler.STATE.ENABLED;
    this.skipUnveiling = false;
    this.currentDialogue = [];
    this.currentIndex = -1;
    this.fullCurrentText = "";
    this.currentText = "";
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
}

DialogueHandler.prototype.enable = function() {
    this.state = DialogueHandler.STATE.ENABLED;
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
        this.currentIndex = -1;
        return;
    }

    const { language, portraitHandler, world } = gameContext;
    const { turnManager } = world;
    const { narrator, text } = this.currentDialogue[this.currentIndex];
    const translation = language.get(text, LanguageHandler.TAG_TYPE.MAP);
    const actorType = turnManager.getActorType(narrator);

    if(actorType) {
        const { portrait, name } = actorType;
        const portraitTexture = portraitHandler.getPortraitTexture(portrait);
        const nameTranslation = language.get(name);

        //TODO: Implement rendering for name/portrait.
    }

    this.fullCurrentText = translation;

    if(this.skipUnveiling) {
        this.showFullText();
    }

    //TODO: Implement rendering for text.
}

DialogueHandler.prototype.advanceLetter = function() {
    if(this.currentText.length < this.fullCurrentText.length) {
        this.currentText += this.fullCurrentText[this.currentText.length];
    }
}

DialogueHandler.prototype.showFullText = function() {
    this.currentText = this.fullCurrentText;
}

DialogueHandler.prototype.skip = function() {
    this.currentDialogue = [];
    this.currentIndex = -1;
}

DialogueHandler.prototype.update = function(gameContext) {

}