export const SpriteHelper = {
    getSchemaID: function(spriteID, schemaID) {
        return spriteID + "::" + schemaID;
    },
    createSpriteWithAlias: function(gameContext, spriteID, schemaID, layerID) {
        const { spriteManager } = gameContext;
        const aliasID = SpriteHelper.getSchemaID(spriteID, schemaID);

        spriteManager.createSpriteAlias(spriteID, schemaID);

        return spriteManager.createSprite(aliasID, layerID);
    },
    createColoredSprite: function(gameContext, spriteID, schemaID, schema, layerID) {
        const { spriteManager } = gameContext;
        const schemaType = schema[schemaID];
        const aliasID = SpriteHelper.getSchemaID(spriteID, schemaID);

        if(schemaType) {
            spriteManager.createCopyTexture(spriteID, schemaID, schemaType);
        }

        return spriteManager.createSprite(aliasID, layerID);
    },
    updateColoredSprite: function(gameContext, spriteIndex, spriteID, schemaID, schema) {
        const { spriteManager } = gameContext;
        const schemaType = schema[schemaID];
        const aliasID = SpriteHelper.getSchemaID(spriteID, schemaID);

        if(schemaType) {
            spriteManager.createCopyTexture(spriteID, schemaID, schemaType);
        }

        spriteManager.updateSprite(spriteIndex, aliasID);
    }
};