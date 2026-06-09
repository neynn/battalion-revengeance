import { EffectComponent } from "../../../engine/world/event/effectComponent.js";
import { playSprite } from "../../systems/sprite.js";

export const PlaySpriteComponent = function({ sprite, tileX, tileY }) {
    EffectComponent.call(this);

    this.sprite = sprite;
    this.tileX = tileX;
    this.tileY = tileY;
}

PlaySpriteComponent.prototype = Object.create(EffectComponent.prototype);
PlaySpriteComponent.prototype.constructor = PlaySpriteComponent;

PlaySpriteComponent.prototype.play = function(gameContext) {
    const { spriteManager } = gameContext;
    const spriteID = spriteManager.getSpriteID(this.sprite);

    playSprite(gameContext, spriteID, this.tileX, this.tileY);
}