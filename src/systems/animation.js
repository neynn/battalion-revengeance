import { LAYER_TYPE } from "../enums.js";
import { playSFX } from "./sound.js";

export const playGFX = function(gameContext, spriteType, tileX, tileY) {
    const { spriteManager, transform2D } = gameContext;
    const sprite = spriteManager.createSprite(spriteType, LAYER_TYPE.GFX);

    if(sprite) {
        const { x, y } = transform2D.transformTileToWorld(tileX, tileY);

        sprite.setPosition(x, y);
        sprite.expire();
    }
}

export const playExplosion = function(gameContext, tileX, tileY) {;
    playSFX(gameContext, "explosion");
    playGFX(gameContext, "explosion", tileX, tileY);
}