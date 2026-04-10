import { EffectComponent } from "../../../engine/world/event/effectComponent.js";

export const PlaySoundComponent = function(sound) {
    EffectComponent.call(this);

    this.sound = sound;
}

PlaySoundComponent.prototype = Object.create(EffectComponent.prototype);
PlaySoundComponent.prototype.constructor = PlaySoundComponent;

PlaySoundComponent.prototype.play = function(gameContext) {
    const { client } = gameContext;
    const { soundPlayer } = client;

    soundPlayer.play(this.sound);
}