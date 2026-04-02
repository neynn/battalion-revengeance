import { EventComponent } from "../../../engine/world/event/eventComponent.js";
import { playSprite } from "../../systems/sprite.js";

export const PlaySpriteComponent = function(sprite, x, y) {
    EventComponent.call(this);

    this.sprite = sprite;
    this.tileX = x;
    this.tileY = y;
}

PlaySpriteComponent.prototype = Object.create(EventComponent.prototype);
PlaySpriteComponent.prototype.constructor = PlaySpriteComponent;

PlaySpriteComponent.prototype.execute = function(gameContext) {
    playSprite(gameContext, this.sprite, this.tileX, this.tileY);
}