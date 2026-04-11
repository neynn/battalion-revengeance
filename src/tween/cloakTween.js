import { FADE_RATE } from "../constants.js";
import { Tween } from "../../engine/tween/tween.js";

export const CloakTween = function(cloakable) {
    Tween.call(this);

    this.cloakable = cloakable;
    this.opacity = 1;
    this.waitType = Tween.WAIT_TYPE.SEQUENTIAL;
}

CloakTween.prototype = Object.create(Tween.prototype);
CloakTween.prototype.constructor = CloakTween;

CloakTween.prototype.update = function(gameContext) {
    const { timer } = gameContext;
    const { deltaTime } = timer;

    this.opacity -= FADE_RATE * deltaTime;

    if(this.opacity <= 0) {
        this.opacity = 0;
        this.state = Tween.STATE.COMPLETE;
    }

    this.cloakable.setOpacity(this.opacity);
}