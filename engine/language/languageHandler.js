import { Language } from "./language.js";

export const LanguageHandler = function() {
    this.languages = new Map();
    this.currentLanguage = LanguageHandler.STUB_LANGUAGE;
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

LanguageHandler.prototype.onLanguageSelect = async function(gameContext) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(worldMap) {
        const config = worldMap.getConfig();

        if(config) {
            const translations = await mapManager.loadMapTranslations(config, this.currentLanguage);

            if(translations !== null) {
                const mapID = worldMap.getID();

                this.currentLanguage.registerMap(mapID, translations);

                worldMap.onLanguageUpdate(this.currentLanguage, translations);
            }
        }
    }
}

LanguageHandler.prototype.selectLanguage = function(gameContext, languageID) {
    if(this.currentLanguage.getID() !== languageID) {
        const language = this.languages.get(languageID);

        if(language) {
            language.loadFiles(response => {
                switch(response) {
                    case Language.LOAD_RESPONSE.SUCCESS: {
                        this.currentLanguage = language;
                        this.onLanguageSelect(gameContext);
                        break;
                    }
                }
            });
        }
    }
}

LanguageHandler.prototype.get = function(key, tag = LanguageHandler.TAG_TYPE.SYSTEM) {
    switch(tag) {
        case LanguageHandler.TAG_TYPE.SYSTEM: return this.currentLanguage.getTranslation(key);
        case LanguageHandler.TAG_TYPE.MAP: return this.currentLanguage.getMapTranslation(key);
        default: key;
    }
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