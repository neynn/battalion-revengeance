import { EventEmitter } from "../events/eventEmitter.js";

export const LanguageHandler = function() {
    this.languages = new Map();
    this.languageID = null;
    this.currentLanguage = null;

    this.mapTranslations = new Map();
    this.mapID = null;
    this.currentMap = null;

    this.events = new EventEmitter();
    this.events.register(LanguageHandler.EVENT.LANGUAGE_REGISTER);
    this.events.register(LanguageHandler.EVENT.LANGUAGE_CHANGE);
    this.events.register(LanguageHandler.EVENT.MAP_CHANGE);
}

LanguageHandler.TAG_TYPE = {
    SYSTEM: 0,
    MAP: 1
};

LanguageHandler.LANGUAGE = {
    ENGLISH: "en-US",
    GERMAN: "de-DE",
    SPANISH: "es-ES"
};

LanguageHandler.EVENT = {
    LANGUAGE_REGISTER: "LANGUAGE_REGISTER",
    LANGUAGE_CHANGE: "LANGUAGE_CHANGE",
    MAP_CHANGE: "MAP_CHANGE"
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
    this.mapID = null;
    this.currentMap = null;
}

LanguageHandler.prototype.selectMap = function(mapID) {
    if(this.mapID !== mapID) {
        const translations = this.mapTranslations.get(mapID);

        if(translations) {
            this.currentMap = translations;
            this.mapID = mapID;
            this.events.emit(LanguageHandler.EVENT.MAP_CHANGE, mapID);
        }
    }
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

LanguageHandler.prototype.registerMap = function(mapID, translations) {
    if(translations) {
        this.mapTranslations.set(mapID, translations);

        if(this.mapID === mapID) {
            this.currentMap = translations;
        }
    }
}

LanguageHandler.prototype.get = function(key, tagType = LanguageHandler.TAG_TYPE.SYSTEM) {
    switch(tagType) {
        case LanguageHandler.TAG_TYPE.SYSTEM: return this.getSystemTag(key);
        case LanguageHandler.TAG_TYPE.MAP: return this.getMapTag(key);
        default: key;
    }
}

LanguageHandler.prototype.getMapTag = function(key) {
    if(!this.currentMap || typeof key !== "string") {
        console.warn("Error!", key);

        return key;
    }

    const text = this.currentMap[key];

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