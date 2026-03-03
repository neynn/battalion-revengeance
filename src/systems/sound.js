import { SOUND_TYPE } from "../enums.js";

const DEFAULT_SOUNDS = {
    [SOUND_TYPE.HEAL]: "heal",
    [SOUND_TYPE.CLOAK]: "cloak",
    [SOUND_TYPE.DEATH]: "explosion",
    [SOUND_TYPE.UNCLOAK]: "uncloak",
};

export const playUncloakSound = function(gameContext) {
    const { client } = gameContext;
    const { soundPlayer } = client;

    soundPlayer.play("uncloak");
}

export const playSFX = function(gameContext, soundID) {
    const { client } = gameContext;
    const { soundPlayer } = client;

    soundPlayer.play(soundID);
}

export const playEntitySound = function(gameContext, entity, soundType) {
    const { client } = gameContext;
    const { soundPlayer } = client;
    let soundID = entity.config.sounds[soundType];

    if(!soundID) {
        soundID = DEFAULT_SOUNDS[soundType];
    }

    if(soundID) {
        soundPlayer.play(soundID);
    }
}

export const bufferEntitySounds = function(gameContext, entity) {
    const { client } = gameContext;
    const { soundPlayer } = client;

    for(const soundName in entity.config.sounds) {
        const sound = entity.config.sounds[soundName];

        if(Array.isArray(sound)) {
            for(const soundID of sound) {
                soundPlayer.bufferAudio(soundID);
            }
        } else {
            soundPlayer.bufferAudio(sound);
        }
    }
}