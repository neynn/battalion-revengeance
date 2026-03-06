import { EventComponent } from "../../../engine/world/event/eventComponent.js";
import { EFFECT_TYPE } from "../../enums.js";
import { playExplosion } from "../../systems/sprite.js";
import { playSprite } from "../../systems/sprite.js";

export const PlayEffectComponent = function(effects) {
    EventComponent.call(this);

    this.effects = effects;
}

PlayEffectComponent.prototype = Object.create(EventComponent.prototype);
PlayEffectComponent.prototype.constructor = PlayEffectComponent;

PlayEffectComponent.prototype.execute = function(gameContext) {
    const { client } = gameContext;
    const { soundPlayer } = client;

    for(const effect of this.effects) {
        switch(effect.type) {
            case EFFECT_TYPE.EXPLOSION: {
                playExplosion(gameContext, effect.x, effect.y);
                break;
            }
            case EFFECT_TYPE.SFX: {
                soundPlayer.play(effect.sfx);
                break;
            }
            case EFFECT_TYPE.GFX: {
                playSprite(gameContext, effect.gfx, effect.x, effect.y);
                break;
            }
            default: {
                console.warn("Unknown effect type", effect.type);
                break;
            }
        }
    }
}