import { FADE_RATE } from "../constants.js";
import { Tween } from "../../engine/tween/tween.js";

export const UncloakTween = function(cloakable) {
    Tween.call(this);

    this.cloakable = cloakable;
    this.opacity = 0;
    this.waitType = Tween.WAIT_TYPE.SEQUENTIAL_ALL;
}

UncloakTween.prototype = Object.create(Tween.prototype);
UncloakTween.prototype.constructor = UncloakTween;

UncloakTween.prototype.update = function(gameContext) {
    const { timer } = gameContext;
    const { deltaTime } = timer;

    this.opacity += FADE_RATE * deltaTime;

    if(this.opacity >= 1) {
        this.opacity = 1;
        this.state = Tween.STATE.COMPLETE;
    }

    this.cloakable.setOpacity(this.opacity);
}