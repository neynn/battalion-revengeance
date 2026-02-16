import { LanguageHandler } from "./engine/language/languageHandler.js";

const getReason = function(code) {
    switch(code) {
        case LanguageHandler.TEST_CODE.MISSING_TRANSLATION: return "No translation found!";
        case LanguageHandler.TEST_CODE.EMPTY_TRANSLATION: return "Translation is empty!";
        default: return "Unknown reason!";
    }
}

export const tAllNamesAndDescriptionsPresent = function(gameContext, types) {
    const { language } = gameContext;
    const mNames = [];
    const mDesc = [];

    for(const typeID in types) {
        const { name, desc } = types[typeID];
        const nCode = language.getSystemTranslationCode(name);
        const dCode = language.getSystemTranslationCode(desc);

        switch(nCode) {
            case LanguageHandler.TEST_CODE.EMPTY_TRANSLATION:
            case LanguageHandler.TEST_CODE.MISSING_TRANSLATION: {
                mNames.push({
                    "typeID": typeID,
                    "reason": getReason(nCode)
                });
                break;
            }
        }

        switch(dCode) {
            case LanguageHandler.TEST_CODE.EMPTY_TRANSLATION:
            case LanguageHandler.TEST_CODE.MISSING_TRANSLATION: {
                mDesc.push({
                    "typeID": typeID,
                    "reason": getReason(dCode)
                });
                break;
            }
        }
    }

    return {
        "names": mNames,
        "descriptions": mDesc
    }
}