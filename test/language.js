const TEST_CODE = {
    VALID: 0,
    INVALID_INPUT: 1,
    MISSING_TRANSLATION: 2,
    EMPTY_TRANSLATION: 3
};

const getReason = function(code) {
    switch(code) {
        case TEST_CODE.MISSING_TRANSLATION: return "No translation found!";
        case TEST_CODE.EMPTY_TRANSLATION: return "Translation is empty!";
        default: return "Unknown reason!";
    }
}

const getSystemTranslationCode = function(handler, key) {
    if(typeof key !== "string") {
        return TEST_CODE.INVALID_INPUT;
    }

    const translation = handler.systemText.get(key);

    if(translation === undefined) {
        return TEST_CODE.MISSING_TRANSLATION;
    }

    if(translation.length === 0) {
        return TEST_CODE.EMPTY_TRANSLATION;
    }

    return TEST_CODE.VALID;
}

export const tAllNamesAndDescriptionsPresent = function(gameContext, types) {
    const { language } = gameContext;
    const mNames = [];
    const mDesc = [];

    for(const typeID in types) {
        const { name, desc } = types[typeID];
        const nCode = getSystemTranslationCode(language, name);
        const dCode = getSystemTranslationCode(language, desc);

        switch(nCode) {
            case TEST_CODE.EMPTY_TRANSLATION:
            case TEST_CODE.MISSING_TRANSLATION: {
                mNames.push({
                    "typeID": typeID,
                    "reason": getReason(nCode)
                });
                break;
            }
        }

        switch(dCode) {
            case TEST_CODE.EMPTY_TRANSLATION:
            case TEST_CODE.MISSING_TRANSLATION: {
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