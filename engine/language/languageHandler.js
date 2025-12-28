import { EventEmitter } from "../events/eventEmitter.js";
import { getPercent } from "../math/math.js";
import { Language } from "./language.js";

export const LanguageHandler = function() {
    this.languages = new Map();
    this.currentLanguage = LanguageHandler.STUB_LANGUAGE;
    this.mapTranslations = {};
    this.flags = LanguageHandler.FLAG.IS_STRICT;

    this.events = new EventEmitter();
    this.events.register(LanguageHandler.EVENT.LANGUAGE_CHANGE);
}

LanguageHandler.STUB_LANGUAGE = new Language("??-??", "", []);

LanguageHandler.LANGUAGE = {
    ENGLISH: "en-US",
    GERMAN: "de-DE",
    SPANISH: "es-ES"
};

LanguageHandler.EVENT = {
    LANGUAGE_CHANGE: "LANGUAGE_CHANGE"
};

LanguageHandler.FLAG = {
    NONE: 0,
    IS_STRICT: 1 << 0,
    DO_FALLBACK: 1 << 1
};

LanguageHandler.prototype.load = function(languages) {
    for(const languageID in languages) {
        const { directory = "", sources = [] } = languages[languageID];

        if(!this.languages.has(languageID)) {
            const language = new Language(languageID, directory, sources);

            this.languages.set(languageID, language);
        }
    }
}

LanguageHandler.prototype.clearMapTranslations = function() {
    this.mapTranslations = {};
}

LanguageHandler.prototype.registerMapTranslations = function(mapTranslations) {
    this.mapTranslations = mapTranslations;
}

LanguageHandler.prototype.getCurrent = function() {
    return this.currentLanguage;
}

LanguageHandler.prototype.clear = function() {
    this.languages.forEach(language => language.clear());
    this.currentLanguage = LanguageHandler.STUB_LANGUAGE;
}

LanguageHandler.prototype.exit = function() {}

LanguageHandler.prototype.selectLanguage = function(languageID) {
    if(this.currentLanguage.getID() !== languageID) {
        const language = this.languages.get(languageID);

        if(language) {
            language.loadFiles(response => {
                switch(response) {
                    case Language.LOAD_RESPONSE.SUCCESS: {
                        this.currentLanguage = language;
                        this.events.emit(LanguageHandler.EVENT.LANGUAGE_CHANGE, {
                            "language": language,
                        });
                        break;
                    }
                }
            });
        }
    }
}

LanguageHandler.prototype.getSystemTranslation = function(key) {
    if(typeof key !== "string") {
        return "";
    }

    const translation = this.currentLanguage.getTranslation(key);

    if(translation.length === 0) {
        if(this.flags & LanguageHandler.FLAG.IS_STRICT) {
            console.warn(`Missing translation! <${key}> in ${this.currentLanguage.getID()}`);

            return key;
        }
    }

    return translation;
}

LanguageHandler.prototype.getMapTranslation = function(tag) {
    const translations = this.mapTranslations[tag];
    
    if(!translations) {
        return tag;
    }

    const translation = translations[this.currentLanguage.getID()];

    if(!translation) {
        if(this.flags & LanguageHandler.FLAG.DO_FALLBACK) {
            const fallback = translations[LanguageHandler.LANGUAGE.ENGLISH];

            if(fallback) {
                return fallback;
            } else {
                return tag;
            }
        }

        return tag;
    }

    return translation;
}

LanguageHandler.prototype.getAllMissingTags = function(template, keywords = []) {
    const templateSize = Object.keys(template).length;
    const languageMissing = new Map();

    for(const [languageID, language] of this.languages) {
        const missing = language.getMissingTags(template);
        const percentDone = getPercent(missing.size, templateSize);
        const filtered = new Set();

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