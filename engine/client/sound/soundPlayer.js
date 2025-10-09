import { PathHandler } from "../../resources/pathHandler.js";
import { Sound } from "./sound.js";

export const SoundPlayer = function() {
    this.volume = 0.3;
    this.sounds = {};
    this.loadedSounds = new Map();
    this.activeSounds = new Map();
    this.audioContext = new AudioContext();
}

SoundPlayer.prototype.load = function(soundTypes) {
    if(!soundTypes) {
        return;
    }

    this.sounds = soundTypes; 
}

SoundPlayer.prototype.exit = function() {
    this.loadedSounds.forEach(sound => sound.stop());
    this.activeSounds.clear();
}

SoundPlayer.prototype.bufferAudio = async function(audioID) {
    const soundType = this.sounds[audioID];

    if(!soundType) {
        return Promise.resolve(null);
    }

    const { directory, source, volume = this.volume, allowStacking } = soundType; 

    if(this.loadedSounds.has(audioID)) {
        return Promise.resolve(this.loadedSounds.get(audioID));
    }
    
    const path = PathHandler.getPath(directory, source);

    return PathHandler.promiseAudioBuffer(path, this.audioContext)
    .then(audioBuffer => {
        const sound = new Sound(audioBuffer, volume, allowStacking);

        this.activeSounds.set(audioID, 0);
        this.loadedSounds.set(audioID, sound);

        sound.onInstanceEnd = (instanceID) => this.onSoundEnded(audioID, instanceID);
        sound.onInstanceStart = (instanceID) => this.onSoundStarted(audioID, instanceID);

        return sound;
    });
}

SoundPlayer.prototype.onSoundEnded = function(audioID, instanceID) {
    if(!this.activeSounds.has(audioID)) {
        return;
    }

    const count = this.activeSounds.get(audioID) - 1;

    if(count <= 0) {
        this.activeSounds.set(audioID, 0);
    } else {
        this.activeSounds.set(audioID, count);
    }
}

SoundPlayer.prototype.onSoundStarted = function(audioID, instanceID) {
    if(!this.activeSounds.has(audioID)) {
        return;
    }

    const count = this.activeSounds.get(audioID) + 1;

    this.activeSounds.set(audioID, count);
}

SoundPlayer.prototype.isPlayable = function(soundID) {
    const soundType = this.sounds[soundID];

    if(!soundType) {
        return false;
    }

    if(!this.activeSounds.has(soundID)) {
        return true;
    }

    const { allowStacking } = soundType;
    const count = this.activeSounds.get(soundID);

    return allowStacking || count === 0;
}

SoundPlayer.prototype.getRandomSoundID = function(soundList) {
    const validIndices = [];

    for(let i = 0; i < soundList.length; i++) {
        const soundID = soundList[i];
        const isPlayable = this.isPlayable(soundID);

        if(isPlayable) {
            validIndices.push(i);
        }
    }

    if(validIndices.length === 0) {
        return null;
    }

    const randomIndexIndex = Math.floor(Math.random() * validIndices.length);
    const randomIndex = validIndices[randomIndexIndex];

    return soundList[randomIndex];
}

SoundPlayer.prototype.stop = function(soundID) {
    const soundObject = this.loadedSounds.get(soundID);

    if(soundObject) {
        soundObject.stop();
    }
}

SoundPlayer.prototype.play = function(sounds) {
    switch(typeof sounds) {
        case "string": {
            this.playSound(sounds);
            return sounds;
        }
        case "object": {
            const soundID = this.getRandomSoundID(sounds);

            if(soundID) {
                this.playSound(soundID);
            }

            return soundID;
        }
        default: {
            console.warn("Unknown input!");
            return null;
        }
    }
}

SoundPlayer.prototype.playSound = async function(audioID) {
    const sound = await this.bufferAudio(audioID);

    if(sound) {
        sound.play(this.audioContext);
    }
}