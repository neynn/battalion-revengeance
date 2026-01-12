export const getGeneratedCash = function(gameContext, traits) {
    const { typeRegistry } = gameContext;
    let generatedCash = 0;

    for(const traitID of traits) {
        const { cashPerTurn } = typeRegistry.getTraitType(traitID);

        generatedCash += cashPerTurn;
    }

    return generatedCash;
}

export const getGlobalGeneratedCash = function(gameContext, traits) {
    const { typeRegistry } = gameContext;
    let generatedCash = 0;

    for(const traitID of traits) {
        const { cashPerGlobalTurn } = typeRegistry.getTraitType(traitID);

        generatedCash += cashPerGlobalTurn;
    }

    return generatedCash;
}