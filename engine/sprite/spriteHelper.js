export const SpriteHelper = {
    createSpriteWithAlias: function(gameContext, spriteID, schemaID, layerID) {
        const { spriteManager } = gameContext;
        const aliasID = spriteManager.getAlias(spriteID, schemaID);

        spriteManager.createSpriteAlias(spriteID, schemaID);

        return spriteManager.createSprite(aliasID, layerID);
    },
    createColoredSprite: function(gameContext, spriteID, schemaID, schemaType, layerID) {
        const { spriteManager } = gameContext;
        const aliasID = spriteManager.getAlias(spriteID, schemaID);

        spriteManager.createCopyTexture(spriteID, schemaID, schemaType);

        return spriteManager.createSprite(aliasID, layerID);
    },
    updateColoredSprite: function(gameContext, spriteIndex, spriteID, schemaID, schemaType) {
        const { spriteManager } = gameContext;
        const aliasID = spriteManager.getAlias(spriteID, schemaID);

        spriteManager.createCopyTexture(spriteID, schemaID, schemaType);
        spriteManager.updateSprite(spriteIndex, aliasID);
    }
};