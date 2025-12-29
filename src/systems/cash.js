export const getGeneratedCash = function(gameContext, traits) {
    const { typeRegistry } = gameContext;
    let generatedCash = 0;

    for(const traitID of traits) {
        const { cashPerTurn } = typeRegistry.getTraitType(traitID);

        generatedCash += cashPerTurn;
    }

    return generatedCash;
}