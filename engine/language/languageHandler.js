import { EventEmitter } from "../events/eventEmitter.js";
import { Language } from "./language.js";

export const LanguageHandler = function() {
    this.languages = new Map();
    this.currentLanguage = LanguageHandler.STUB_LANGUAGE;

    this.events = new EventEmitter();
    this.events.register(LanguageHandler.EVENT.LANGUAGE_CHANGE);
}

LanguageHandler.STUB_LANGUAGE = new Language("MISSING", []);

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
    LANGUAGE_CHANGE: "LANGUAGE_CHANGE"
};

LanguageHandler.IS_STRICT = 1;

LanguageHandler.prototype.load = function(languages) {
    for(const languageID in languages) {
        const files = languages[languageID];

        if(!this.languages.has(languageID)) {
            const language = new Language(languageID, files);

            this.languages.set(languageID, language);
        }
    }
}

LanguageHandler.prototype.enableMap = function(mapID) {
    this.currentLanguage.selectMap(mapID);
}

LanguageHandler.prototype.getCurrent = function() {
    return this.currentLanguage;
}

LanguageHandler.prototype.clear = function() {
    this.languages.forEach(language => language.clear());
    this.currentLanguage = LanguageHandler.STUB_LANGUAGE;
}

LanguageHandler.prototype.exit = function() {
    this.languages.forEach(language => language.clearMap());
}

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

LanguageHandler.prototype.getSystemTranslation = function(tag) {
    return this.currentLanguage.getTranslation(tag);
}

LanguageHandler.prototype.getMapTranslation = function(tag) {
    return this.currentLanguage.getMapTranslation(tag);
}

LanguageHandler.prototype.getAllMissingTags = function(template, keywords = []) {
    const templateSize = Object.keys(template).length;
    const languageMissing = new Map();

    for(const [languageID, language] of this.languages) {
        const missing = language.getMissingTags(template);
        const percentDone = (1 - (missing.size / templateSize)) * 100;
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