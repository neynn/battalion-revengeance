import { DEATH_FADE_RATE } from "../../constants.js";
import { Tween } from "../tween.js";

export const DeathTween = function(cloakables) {
    Tween.call(this);

    this.cloakables = cloakables;
    this.opacity = 1;
    this.waitType = Tween.WAIT_TYPE.PARALLEL;
}

DeathTween.prototype = Object.create(Tween.prototype);
DeathTween.prototype.constructor = DeathTween;

DeathTween.prototype.update = function(gameContext) {
    const { timer } = gameContext;
    const { deltaTime } = timer;

    this.opacity -= DEATH_FADE_RATE * deltaTime;

    if(this.opacity < 0) {
        this.opacity = 0;
        this.state = Tween.STATE.COMPLETE;
    }

    for(const cloakable of this.cloakables) {
        cloakable.setOpacity(this.opacity);
    }
}