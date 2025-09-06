import { clampValue } from "../../math/math.js";
import { Effect } from "../effect.js";

export const FadeOutEffect = function(id, target, rate = 1, limit = 1) {
    Effect.call(this, id);

    this.target = target;
    this.rate = rate;
    this.limit = clampValue(limit, 1, 0);
}

FadeOutEffect.prototype = Object.create(Effect.prototype);
FadeOutEffect.prototype.constructor = FadeOutEffect;

FadeOutEffect.prototype.update = function(display, deltaTime) {
    const currentOpactiy = this.target.getOpacity();
    const nextOpacity = currentOpactiy - (this.rate * deltaTime);
    const clampedOpactiy = clampValue(nextOpacity, 1, this.limit);

    this.target.setOpacity(clampedOpactiy);
}

FadeOutEffect.prototype.isFinished = function() {
    return this.target.getOpacity() <= this.limit;
}