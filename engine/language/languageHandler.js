import { EventEmitter } from "../events/eventEmitter.js";

export const LanguageHandler = function() {
    this.languages = new Map();
    this.languageID = null;
    this.currentLanguage = null;
    this.mapTranslations = new Map();

    this.events = new EventEmitter();
    this.events.listen(LanguageHandler.EVENT.LANGUAGE_REGISTER);
    this.events.listen(LanguageHandler.EVENT.LANGUAGE_CHANGE);
}

LanguageHandler.LANGUAGE = {
    ENGLISH: "en-US",
    GERMAN: "de-DE",
    SPANISH: "es-ES"
};

LanguageHandler.EVENT = {
    LANGUAGE_REGISTER: "LANGUAGE_REGISTER",
    LANGUAGE_CHANGE: "LANGUAGE_CHANGE"
};

LanguageHandler.IS_STRICT = 1;

LanguageHandler.isAllowed = function(languageID) {
    return Object.values(LanguageHandler.LANGUAGE).includes(languageID);
}

LanguageHandler.prototype.getCurrent = function() {
    return this.languageID;
}

LanguageHandler.prototype.exit = function() {
    this.events.muteAll();
    this.mapTranslations.clear();
}

LanguageHandler.prototype.selectLanguage = function(languageID) {
    if(this.languageID !== languageID) {
        const language = this.languages.get(languageID);

        if(language) {
            this.currentLanguage = language;
            this.languageID = languageID;
            this.events.emit(LanguageHandler.EVENT.LANGUAGE_CHANGE, languageID);
        }
    }
}

LanguageHandler.prototype.registerLanguage = function(languageID, language) {
    if(LanguageHandler.isAllowed(languageID)) {
        this.languages.set(languageID, language);
        this.events.emit(LanguageHandler.EVENT.LANGUAGE_REGISTER, languageID);

        if(this.languageID === languageID) {
            this.events.emit(LanguageHandler.EVENT.LANGUAGE_CHANGE, languageID);
        }
    }
}

LanguageHandler.prototype.registerMap = function(mapID, language) {
    if(language) {
        this.mapTranslations.set(mapID, language);
    }
}

LanguageHandler.prototype.getMapTag = function(mapID, key) {
    const translations = this.mapTranslations.get(mapID);

    if(translations) {
        const text = translations[key];

        if(text !== undefined && text.length !== 0) {
            return text;
        }
    }

    return key;
}   

LanguageHandler.prototype.getSystemTag = function(key) {
    if(!this.currentLanguage || typeof key !== "string") {
        console.warn("Error!", key);

        return key;
    }

    const text = this.currentLanguage[key];

    if(text === undefined) {
        if(LanguageHandler.IS_STRICT) {
            console.warn("Translation does not exist!", key, this.languageID);
        }

        return key;
    }

    if(LanguageHandler.IS_STRICT) {
        if(text.length === 0) {
            console.warn("Translation is empty!", key, this.languageID);

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

        if(!tag || (tag.length === 0 && LanguageHandler.IS_STRICT)) {
            missing.add(tagID);
        }
    }

    return missing;
}