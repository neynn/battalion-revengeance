import { EventEmitter } from "./events/eventEmitter.js";

export const LanguageHandler = function() {
    this.languages = new Map();
    this.currentLanguage = null;
    this.currentLanguageID = null;

    this.events = new EventEmitter();
    this.events.listen(LanguageHandler.EVENT.LANGUAGE_CHANGE);
}

LanguageHandler.EVENT = {
    LANGUAGE_CHANGE: "LANGUAGE_CHANGE"
};

LanguageHandler.STRICT = 1;

LanguageHandler.prototype.exit = function() {
    this.events.muteAll();
}

LanguageHandler.prototype.selectLanguage = function(languageID) {
    const language = this.languages.get(languageID);

    if(!language) {
        return;
    }

    if(this.currentLanguageID !== languageID) {
        this.currentLanguage = language;
        this.currentLanguageID = languageID;
        this.events.emit(LanguageHandler.EVENT.LANGUAGE_CHANGE, languageID);
    }
}

LanguageHandler.prototype.addLanguage = function(languageID, language) {
    if(this.languages.has(languageID)) {
        return;
    }

    this.languages.set(languageID, language);
}

LanguageHandler.prototype.get = function(key) {
    if(!this.currentLanguage || typeof key !== "string") {
        console.warn("Error!", key);

        return key;
    }

    const text = this.currentLanguage[key];

    if(text === undefined) {
        if(LanguageHandler.STRICT) {
            console.warn("Translation does not exist!", key, this.currentLanguageID);
        }

        return key;
    }

    if(LanguageHandler.STRICT) {
        if(text.length === 0) {
            console.warn("Translation is empty!", key, this.currentLanguageID);

            return key;
        }
    }

    return text;
}

LanguageHandler.prototype.getAllMissingTags = function(template, keywords = []) {
    const templateSize = Object.keys(template).length;
    const languageMissing = new Map();

    for(const [languageID] of this.languages) {
        const missing = this.getMissingTags(template, languageID);
        const filtered = new Set();
        const percentDone = (1 - (missing.size / templateSize)) * 100;

        languageMissing.set(languageID, {
            "regular": missing,
            "filtered": filtered,
            "done": percentDone
        });
    }

    for(let i = 0; i < keywords.length; i++) {
        const keyword = keywords[i];

        languageMissing.forEach(({regular, filtered}) => {
            for(const tagID of regular) {
                if(tagID.includes(keyword)) {
                    filtered.add(tagID);
                }
            }
        });
    }

    return languageMissing;
}

LanguageHandler.prototype.getMissingTags = function(template, languageID) {
    const missing = new Set();
    const language = this.languages.get(languageID);

    if(!language) {
        return missing;
    }

    for(const tagID in template) {
        const tag = language[tagID];

        if(!tag || (tag.length === 0 && LanguageHandler.STRICT)) {
            missing.add(tagID);
        }
    }

    return missing;
}