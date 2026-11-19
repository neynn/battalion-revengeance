import { EventEmitter } from "../../engine/events/eventEmitter.js";
import { Language } from "../../engine/language/language.js";
import { getPercent } from "../../engine/math/math.js";

const IS_STRICT = true;

//TODO: Complete.
export const TextRegistry = function() {
    this.languages = new Map();
    this.currentLanguage = TextRegistry.LANGUAGE._INVALID;
    this.fallbackLanguage = TextRegistry.LANGUAGE._INVALID;
    this.systemText = new Map();
    this.scenarioText = new Map();

    this.events = new EventEmitter();
    this.events.register(TextRegistry.EVENT.LANGUAGE_CHANGE);
}

TextRegistry.INVALID_ID = -1;

TextRegistry.LANGUAGE = {
    _INVALID: -1,
    ENGLISH: 0,
    GERMAN: 1,
    SPANISH: 2,
    _COUNT: 3
};

TextRegistry.EVENT = {
    LANGUAGE_CHANGE: "LANGUAGE_CHANGE"
};

TextRegistry.getKey = function(languageID) {
    switch(languageID) {
        case TextRegistry.LANGUAGE.ENGLISH: return "en-US";
        case TextRegistry.LANGUAGE.GERMAN: return "de-DE";
        case TextRegistry.LANGUAGE.SPANISH: return "es-ES";
        default: return "??-??";
    }
}

TextRegistry.prototype.getTranslation = function(translations) {
    const key = TextRegistry.getKey(this.currentLanguage);
    const translation = translations[key];

    if(translation === undefined) {
        return "";
    }

    return translation;
}

TextRegistry.prototype.getCurrentKey = function() {
    return TextRegistry.getKey(this.currentLanguage);
}

TextRegistry.prototype.load = function(languages) {
    for(const languageID in languages) {
        const { directory = "", sources = [] } = languages[languageID];
        const language = new Language(languageID, directory, sources);

        this.languages.set(languageID, language);
    }
}

TextRegistry.prototype.registerScenarioText = function(translations) {
    for(let i = 0; i < translations.length; i++) {
        this.scenarioText.set(i, translations[i]);
    }
}

TextRegistry.prototype.clearScenarioAndMapText = function() {
    this.scenarioText.clear();
}

TextRegistry.prototype.clear = function() {
    this.currentLanguage = TextRegistry.LANGUAGE._INVALID;
    this.systemText.clear();
}

TextRegistry.prototype.exit = function() {
    this.scenarioText.clear();
}

TextRegistry.prototype.selectLanguage = function(languageID) {
    if(this.currentLanguage === languageID) {
        return;
    }

    const languageKey = TextRegistry.getKey(languageID);
    const language = this.languages.get(languageKey);

    if(!language) {
        return;
    }

    language.loadFiles((files) => {
        this.currentLanguage = languageID;
        this.systemText.clear();
        this.loadSystemText(files);
        this.events.emit(TextRegistry.EVENT.LANGUAGE_CHANGE, language);
    });
}

TextRegistry.prototype.loadSystemText = function(files) {
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

TextRegistry.prototype.getSystemTranslation = function(key) {
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

TextRegistry.prototype.getScenarioTranslation = function(key) {
    const translations = this.scenarioText.get(key);

    if(!translations) {
        return "";
    }

    const languageKey = TextRegistry.getKey(this.currentLanguage);
    const translation = translations[languageKey];

    if(translation) {
        return translation;
    }

    if(this.fallbackLanguage !== TextRegistry.LANGUAGE._INVALID) {
        const fallbackKey = TextRegistry.getKey(this.fallbackLanguage);
        const fallback = translations[fallbackKey];

        if(fallback) {
            return fallback;
        }
    }

    return "";
}

TextRegistry.prototype.getMissingTags = function(template) {
    const missing = new Set();

    for(const tagID in template) {
        const tag = this.systemText.get(tagID);

        if(tag === undefined || tag.length === 0) {
            missing.add(tagID);
        }
    }

    return missing;
}

TextRegistry.prototype.getAllMissingTags = function(template, keywords = []) {
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