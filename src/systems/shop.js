export const getEntityCost = function(gameContext, typeID, currencyID) {
    const { typeRegistry } = gameContext;
    const entityType = typeRegistry.getEntityType(typeID);
    const currencyType = typeRegistry.getCurrencyType(currencyID);
    const totalCost = currencyType.exchangeRate * entityType.cost;

    return totalCost;
}