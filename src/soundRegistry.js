import { getRandomElement } from "../engine/math/math.js";
import { ENTITY_TYPE, SOUND_TYPE } from "./enums.js";

const SOUNDS_PER_UNIT_TYPE = SOUND_TYPE._COUNT;
const UNIT_SOUND_COUNT = ENTITY_TYPE._COUNT * SOUNDS_PER_UNIT_TYPE;

/**
 * 
 * @param {number} typeID 
 * @param {number} soundID 
 * @returns 
 */
const getUnitSoundIndex = function(typeID, soundID) {
    if(typeID < 0 || typeID >= ENTITY_TYPE._COUNT) {
        return -1;
    }

    if(soundID < 0 || soundID >= SOUND_TYPE._COUNT) {
        return -1;
    }

    return typeID * SOUNDS_PER_UNIT_TYPE + soundID;
}

const getSoundRegistryIndex = function(soundName, typeID) {
    switch(soundName) {
        case "heal": return getUnitSoundIndex(typeID, SOUND_TYPE.HEAL);
        case "move": return getUnitSoundIndex(typeID, SOUND_TYPE.MOVE);
        case "fire": return getUnitSoundIndex(typeID, SOUND_TYPE.FIRE);
        case "cloak": return getUnitSoundIndex(typeID, SOUND_TYPE.CLOAK);
        case "death": return getUnitSoundIndex(typeID, SOUND_TYPE.DEATH);
        case "recruit": return getUnitSoundIndex(typeID, SOUND_TYPE.RECRUIT);
        case "uncloak": return getUnitSoundIndex(typeID, SOUND_TYPE.UNCLOAK);
        default: return -1;
    }
}

export const SoundRegistry = function() {
    const MAX_SOUND_TYPES = ENTITY_TYPE._COUNT * SOUNDS_PER_UNIT_TYPE;

    this.unitSounds = [];

    for(let i = 0; i < MAX_SOUND_TYPES; i++) {
        this.unitSounds[i] = [];
    }
}

SoundRegistry.prototype.playUnitSound = function(gameContext, unit, soundID) {
    const { client } = gameContext;
    const { soundPlayer } = client;
    const typeID = unit.config.id;
    const index = getUnitSoundIndex(typeID, soundID);

    if(index !== -1) {
        const sounds = this.unitSounds[index];

        soundPlayer.play(getRandomElement(sounds));
    }
}

SoundRegistry.prototype.bufferUnitSounds = function(gameContext, unitID) {
    if(unitID < 0 || unitID >= ENTITY_TYPE._COUNT) {
        return;
    }

    const { client } = gameContext;
    const { soundPlayer } = client;
    const begin = unitID * SOUNDS_PER_UNIT_TYPE;

    for(let i = 0; i < SOUND_TYPE._COUNT; i++) {
        const index = begin + i;
        const sounds = this.unitSounds[index];

        for(const sound of sounds) {
            soundPlayer.bufferAudio(sound);
        }
    }
}

SoundRegistry.prototype.registerUnitSounds = function(gameContext, unitTypes) {
    const { client } = gameContext;
    const { soundPlayer } = client;

    for(const typeName in unitTypes) {
        const rUnitType = unitTypes[typeName];
        const rUnitSounds = rUnitType.sounds ?? {};
        const typeID = ENTITY_TYPE[typeName] ?? ENTITY_TYPE._INVALID;

        for(const soundName in rUnitSounds) {
            const soundIndex = getSoundRegistryIndex(soundName, typeID);

            if(soundIndex !== -1) {
                //The JSON MAY have an array of sounds for a specific sounds.
                //SoundName MAY be a string OR an array.
                const soundNameOrArray = rUnitSounds[soundName];

                if(Array.isArray(soundNameOrArray)) {
                    for(const sound of soundNameOrArray) {
                        this.unitSounds[soundIndex].push(soundPlayer.getSoundID(sound));
                    }
                } else {
                    this.unitSounds[soundIndex].push(soundPlayer.getSoundID(soundNameOrArray));
                }
            }
        }
    }

    const healID = soundPlayer.getSoundID("heal");
    const cloakID = soundPlayer.getSoundID("cloak");
    const deathID = soundPlayer.getSoundID("explosion");
    const uncloakID = soundPlayer.getSoundID("uncloak");

    //Loads default sounds!
    for(let i = 0; i < ENTITY_TYPE._COUNT; i++) {
        const index = i * SOUNDS_PER_UNIT_TYPE;

        if(this.unitSounds[index + SOUND_TYPE.HEAL].length === 0) {
            this.unitSounds[index + SOUND_TYPE.HEAL][0] = healID;
        }
    
        if(this.unitSounds[index + SOUND_TYPE.CLOAK].length === 0) {
            this.unitSounds[index + SOUND_TYPE.CLOAK][0] = cloakID;
        }

        if(this.unitSounds[index + SOUND_TYPE.DEATH].length === 0) {
            this.unitSounds[index + SOUND_TYPE.DEATH][0] = deathID;
        }

        if(this.unitSounds[index + SOUND_TYPE.UNCLOAK].length === 0) {
            this.unitSounds[index + SOUND_TYPE.UNCLOAK][0] = uncloakID;
        }
    }
}