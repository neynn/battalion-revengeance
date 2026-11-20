import { EventEmitter } from "../../engine/events/eventEmitter.js";
import { Language } from "../../engine/language/language.js";
import { getPercent } from "../../engine/math/math.js";

const IS_STRICT = true;

export const TextRegistry = function() {
    this.languages = [];
    this.currentLanguage = TextRegistry.LANGUAGE._INVALID;
    this.scenarioText = [];
    this.systemText = new Map();

    this.events = new EventEmitter();
    this.events.register(TextRegistry.EVENT.LANGUAGE_CHANGE);

    for(let i = 0; i < TextRegistry.LANGUAGE._COUNT; i++) {
        this.languages[i] = new Language(i);
    }
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

TextRegistry.getLanguageID = function(name) {
    switch(name) {
        case "en-US": return TextRegistry.LANGUAGE.ENGLISH;
        case "de-DE": return TextRegistry.LANGUAGE.GERMAN;
        case "es-ES": return TextRegistry.LANGUAGE.SPANISH;
        default: return TextRegistry.LANGUAGE._INVALID;
    }
}

TextRegistry.prototype.load = function(languages) {
    for(const languageName in languages) {
        const { directory = "", sources = [] } = languages[languageName];
        const languageID = TextRegistry.getLanguageID(languageName);

        if(languageID !== TextRegistry.LANGUAGE._INVALID) {
            const language = this.languages[languageID];

            for(const source of sources) {
                language.addPath(directory, source);
            }
        }
    }
}

TextRegistry.prototype.registerScenarioText = function(text) {
    for(const translations of text) {
        const textTranslations = [];

        for(let i = 0; i < TextRegistry.LANGUAGE._COUNT; i++) {
            textTranslations[i] = "";
        }
        
        for(const languageName in translations) {
            const languageID = TextRegistry.getLanguageID(languageName);

            if(languageID !== TextRegistry.INVALID_ID) {
                textTranslations[languageID] = translations[languageName];
            }
        }

        this.scenarioText.push(textTranslations); 
    }
}

TextRegistry.prototype.clearScenarioText = function() {
    this.scenarioText.length = 0;
}

TextRegistry.prototype.clear = function() {
    this.currentLanguage = TextRegistry.LANGUAGE._INVALID;
    this.systemText.clear();
}

TextRegistry.prototype.exit = function() {
    this.scenarioText.length = 0;
}

TextRegistry.prototype.selectLanguage = function(languageID) {
    if(languageID < 0 || languageID >= TextRegistry.LANGUAGE._COUNT) {
        return;
    }

    if(this.currentLanguage === languageID) {
        return;
    }

    const language = this.languages[languageID];

    language.loadFiles((files) => {
        this.currentLanguage = languageID;
        this.systemText.clear();
        this.loadSystemText(files);
        this.events.emit(TextRegistry.EVENT.LANGUAGE_CHANGE, {});
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

TextRegistry.prototype.getScenarioTranslation = function(index) {
    if(index < 0 || index >= this.scenarioText.length) {
        return "";
    }
    
    if(this.currentLanguage < 0 || this.currentLanguage >= TextRegistry.LANGUAGE._COUNT) {
        return "";
    }

    return this.scenarioText[index][this.currentLanguage];
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

    for(const language of this.languages) {
        const missing = language.getMissingTags(template);
        const percentDone = getPercent(missing.size, templateSize);
        const filtered = new Set();

        languageMissing.set(language.id, {
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