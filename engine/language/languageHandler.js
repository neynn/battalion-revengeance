import { EventEmitter } from "../events/eventEmitter.js";
import { getPercent } from "../math/math.js";
import { Language } from "./language.js";

const IS_STRICT = true;

export const LanguageHandler = function() {
    this.languages = new Map();
    this.currentLanguage = LanguageHandler.LANGUAGE._INVALID;
    this.fallbackLanguage = LanguageHandler.LANGUAGE._INVALID;
    this.systemText = new Map();
    this.mapText = [];

    this.events = new EventEmitter();
    this.events.register(LanguageHandler.EVENT.LANGUAGE_CHANGE);
}

LanguageHandler.INVALID_ID = -1;

LanguageHandler.LANGUAGE = {
    _INVALID: -1,
    ENGLISH: 0,
    GERMAN: 1,
    SPANISH: 2,
    _COUNT: 3
};

LanguageHandler.EVENT = {
    LANGUAGE_CHANGE: "LANGUAGE_CHANGE"
};

LanguageHandler.TEST_CODE = {
    VALID: 0,
    INVALID_INPUT: 1,
    MISSING_TRANSLATION: 2,
    EMPTY_TRANSLATION: 3
};

LanguageHandler.getKey = function(languageID) {
    switch(languageID) {
        case LanguageHandler.LANGUAGE.ENGLISH: return "en-US";
        case LanguageHandler.LANGUAGE.GERMAN: return "de-DE";
        case LanguageHandler.LANGUAGE.SPANISH: return "es-ES";
        default: return "??-??";
    }
}

LanguageHandler.prototype.load = function(languages) {
    for(const languageID in languages) {
        const { directory = "", sources = [] } = languages[languageID];
        const language = new Language(languageID, directory, sources);

        this.languages.set(languageID, language);
    }
}

LanguageHandler.prototype.registerMapText = function(translations, text) {
    for(let i = 0; i < text.length; i++) {
        const textID = text[i];
        const translation = translations[textID];

        if(translation === undefined) {
            this.mapText.push({});
        } else {
            this.mapText.push(translation);
        }
    }
}

LanguageHandler.prototype.clearMapTranslations = function() {
    this.mapText.length = 0;
}

LanguageHandler.prototype.clear = function() {
    this.currentLanguage = LanguageHandler.LANGUAGE._INVALID;
    this.systemText.clear();
}

LanguageHandler.prototype.exit = function() {
    this.mapText.length = 0;
}

LanguageHandler.prototype.selectLanguage = function(languageID) {
    if(this.currentLanguage === languageID) {
        return;
    }

    const languageKey = LanguageHandler.getKey(languageID);
    const language = this.languages.get(languageKey);

    if(!language) {
        return;
    }

    language.loadFiles((files) => {
        this.currentLanguage = languageID;
        this.systemText.clear();
        this.loadSystemText(files);
        this.events.emit(LanguageHandler.EVENT.LANGUAGE_CHANGE, language);
    });
}

LanguageHandler.prototype.loadSystemText = function(files) {
    for(const file of files) {
        if(file === null) {
            continue;
        }

        for(const key in file) {
            if(this.systemText.has(key)) {
                console.error(`Translation <${key}> is already set!`);
            } else {
                this.systemText.set(key, file[key]);
            }
        }
    }
}

LanguageHandler.prototype.getSystemTranslationCode = function(key) {
    if(typeof key !== "string") {
        return LanguageHandler.TEST_CODE.INVALID_INPUT;
    }

    const translation = this.systemText.get(key);

    if(translation === undefined) {
        return LanguageHandler.TEST_CODE.MISSING_TRANSLATION;
    }

    if(translation.length === 0) {
        return LanguageHandler.TEST_CODE.EMPTY_TRANSLATION;
    }

    return LanguageHandler.TEST_CODE.VALID;
}

LanguageHandler.prototype.getSystemTranslation = function(key) {
    if(typeof key !== "string") {
        return "";
    }

    const translation = this.systemText.get(key);

    if(translation === undefined) {
        return key;
    }

    if(translation.length === 0 && IS_STRICT) {
        return key;
    }

    return translation;
}

LanguageHandler.prototype.getMapTranslation = function(index) {
    if(index < 0 || index >= this.mapText.length) {
        return "";
    }

    const translations = this.mapText[index];
    const languageKey = LanguageHandler.getKey(this.currentLanguage);
    const translation = translations[languageKey];

    if(translation) {
        return translation;
    }

    if(this.fallbackLanguage !== LanguageHandler.LANGUAGE._INVALID) {
        const fallbackKey = LanguageHandler.getKey(this.fallbackLanguage);
        const fallback = translations[fallbackKey];

        if(fallback) {
            return fallback;
        }
    }

    return "";
}

LanguageHandler.prototype.getMissingTags = function(template) {
    const missing = new Set();

    for(const tagID in template) {
        const tag = this.systemText.get(tagID);

        if(tag === undefined || tag.length === 0) {
            missing.add(tagID);
        }
    }

    return missing;
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