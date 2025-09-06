import { FadeInEffect } from "./example/fadeIn.js";
import { FadeOutEffect } from "./example/fadeOut.js";

export const EffectManager = function() {
    this.nextID = 0;
    this.effects = [];
}

EffectManager.EFFECT_TYPE = {
    FADE_IN: "FADE_IN",
    FADE_OUT: "FADE_OUT"
};

EffectManager.prototype.update = function(display, deltaTime) {
    const finishedEffects = [];

    for(let i = 0; i < this.effects.length; i++) {
        const effect = this.effects[i];

        effect.update(display, deltaTime);

        if(effect.isFinished()) {
            finishedEffects.push(i);
        }
    }

    for(let i = finishedEffects.length - 1; i >= 0; i--) {
        this.effects[i] = this.effects[this.effects.length - 1];
        this.effects.pop();
    }
}

EffectManager.prototype.addEffect = function(effect) {
    this.effects.push(effect);
}

EffectManager.prototype.addEffects = function(graph, effects) {
    for(let i = 0; i < effects.length; i++) {
        const { type, value, threshold } = effects[i];

        switch(type) {
            case EffectManager.EFFECT_TYPE.FADE_IN: {
                this.addEffect(new FadeInEffect(this.nextID++, graph, value, threshold));
                break;
            }
            case EffectManager.EFFECT_TYPE.FADE_OUT: {
                this.addEffect(new FadeOutEffect(this.nextID++, graph, value, threshold));
                break;
            }
            default: {
                console.log(`EffectType ${type} does not exist!`);
                break;
            }
        }
    }
}