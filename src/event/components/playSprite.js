import { EffectComponent } from "../../../engine/world/event/effectComponent.js";
import { playSprite } from "../../systems/sprite.js";

export const PlaySpriteComponent = function(sprite, x, y) {
    EffectComponent.call(this);

    this.sprite = sprite;
    this.tileX = x;
    this.tileY = y;
}

PlaySpriteComponent.prototype = Object.create(EffectComponent.prototype);
PlaySpriteComponent.prototype.constructor = PlaySpriteComponent;

PlaySpriteComponent.prototype.play = function(gameContext) {
    playSprite(gameContext, this.sprite, this.tileX, this.tileY);
}