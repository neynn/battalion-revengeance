import { EventComponent } from "../../../engine/world/event/eventComponent.js";
import { EFFECT_TYPE } from "../../enums.js";
import { playExplosion, playGFX } from "../../systems/animation.js";
import { playSFX } from "../../systems/sound.js";

export const ClientPlayEffectComponent = function(effects) {
    EventComponent.call(this);

    this.effects = effects;
}

ClientPlayEffectComponent.prototype = Object.create(EventComponent.prototype);
ClientPlayEffectComponent.prototype.constructor = ClientPlayEffectComponent;

ClientPlayEffectComponent.prototype.execute = function(gameContext) {
    for(const effect of this.effects) {
        switch(effect.type) {
            case EFFECT_TYPE.EXPLOSION: {
                playExplosion(gameContext, effect.x, effect.y);
                break;
            }
            case EFFECT_TYPE.SFX: {
                playSFX(gameContext, effect.sfx);
                break;
            }
            case EFFECT_TYPE.GFX: {
                playGFX(gameContext, effect.gfx, effect.x, effect.y);
                break;
            }
            default: {
                console.warn("Unknown effect type", effect.type);
                break;
            }
        }
    }
}