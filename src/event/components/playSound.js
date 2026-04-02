import { EventComponent } from "../../../engine/world/event/eventComponent.js";

export const PlaySoundComponent = function(sound) {
    EventComponent.call(this);

    this.sound = sound;
}

PlaySoundComponent.prototype = Object.create(EventComponent.prototype);
PlaySoundComponent.prototype.constructor = PlaySoundComponent;

PlaySoundComponent.prototype.execute = function(gameContext) {
    const { client } = gameContext;
    const { soundPlayer } = client;

    soundPlayer.play(this.sound);
}