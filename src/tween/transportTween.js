import { Tween } from "../../engine/tween/tween.js";
import { updateEntitySprite } from "../systems/sprite.js";

export const TransportTween = function(entity) {
    Tween.call(this);

    this.entity = entity;
    this.waitType = Tween.WAIT_TYPE.SEQUENTIAL;
}

TransportTween.prototype = Object.create(Tween.prototype);
TransportTween.prototype.constructor = TransportTween;

TransportTween.prototype.update = function(gameContext) {
    //TODO(neyn): Fade out to 0.5, then updateEntitySprite, then fade in.
    updateEntitySprite(gameContext, this.entity);
    this.state = Tween.STATE.COMPLETE;

}