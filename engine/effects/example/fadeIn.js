import { clampValue } from "../../math/math.js";
import { Effect } from "../effect.js";

export const FadeInEffect = function(id, target, rate = 1, limit = 1) {
    Effect.call(this, id);

    this.target = target;
    this.rate = rate;
    this.limit = clampValue(limit, 1, 0);
}

FadeInEffect.prototype = Object.create(Effect.prototype);
FadeInEffect.prototype.constructor = FadeInEffect;

FadeInEffect.prototype.update = function(display, deltaTime) {
    const currentOpactiy = this.target.getOpacity();
    const nextOpacity = currentOpactiy + (this.rate * deltaTime);
    const clampedOpactiy = clampValue(nextOpacity, this.limit, 0);

    this.target.setOpacity(clampedOpactiy);
}

FadeInEffect.prototype.isFinished = function() {
    return this.target.getOpacity() >= this.limit;
}