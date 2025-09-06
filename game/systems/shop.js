export const ShopSystem = function() {}

/**
 * Gets the shop type for the current map.
 * 
 * @param {*} gameContext 
 */
ShopSystem.getShopType = function(gameContext) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap || !worldMap.shop) {
        return null;
    }

    return worldMap.shop;
}

//Check if item is buyable
//Get shop for map. Shop is a string referencing a shopType
//ShopType references a few tabs with items in each.
//When clicking, check if the actor has enough of resource xyz to buy the item
//perform a switch with the item. item types are "Entity", tbd...