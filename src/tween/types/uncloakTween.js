import { FADE_RATE } from "../../constants.js";
import { Tween } from "../tween.js";

export const UncloakTween = function(cloakable, maxOpacity = 1) {
    Tween.call(this);

    this.cloakable = cloakable;
    this.opacity = 0;
    this.maxOpacity = maxOpacity;
    this.waitType = Tween.WAIT_TYPE.SEQUENTIAL;
}

UncloakTween.prototype = Object.create(Tween.prototype);
UncloakTween.prototype.constructor = UncloakTween;

UncloakTween.prototype.update = function(gameContext) {
    const { timer } = gameContext;
    const { deltaTime } = timer;

    this.opacity += FADE_RATE * deltaTime;

    if(this.opacity > this.maxOpacity) {
        this.opacity = this.maxOpacity;
        this.state = Tween.STATE.COMPLETE;
    }

    this.cloakable.setOpacity(this.opacity);
}