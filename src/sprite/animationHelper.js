import { TypeRegistry } from "../type/typeRegistry.js";

export const AnimationHelper = {
    playGFX: function(gameContext, spriteType, tileX, tileY) {
        const { spriteManager, transform2D } = gameContext;
        const sprite = spriteManager.createSprite(spriteType, TypeRegistry.LAYER_TYPE.GFX);

        if(sprite) {
            const { x, y } = transform2D.transformTileToWorld(tileX, tileY);

            sprite.setPosition(x, y);
            sprite.expire();
        }
    }
};