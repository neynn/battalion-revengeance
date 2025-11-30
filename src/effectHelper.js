import { TypeRegistry } from "./type/typeRegistry.js";

export const EffectHelper = {
    playExplosion: function(gameContext, tileX, tileY) {
        const { spriteManager, transform2D, client } = gameContext;
        const { soundPlayer } = client;
        const sprite = spriteManager.createSprite("explosion", TypeRegistry.LAYER_TYPE.GFX);

        if(sprite) {
            const { x, y } = transform2D.transformTileToWorld(tileX, tileY);

            sprite.setPosition(x, y);
            sprite.expire();
        }

        soundPlayer.play("explosion");
    }
};