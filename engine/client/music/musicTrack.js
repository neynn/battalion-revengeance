import { clampValue } from "../../math/math.js";

export const MusicTrack = function(audio, volume, isLooping) {
    this.audio = audio;
    this.volume = volume;
    this.isLooping = isLooping;
    this.state = MusicTrack.STATE.NONE;
}

MusicTrack.VOLUME = {
    MIN: 0,
    MAX: 1
};

MusicTrack.STATE = {
    NONE: 0,
    PAUSED: 1,
    PLAYING: 2
};

MusicTrack.prototype.playSilent = function() {
    if(this.state !== MusicTrack.STATE.PLAYING) {
        this.state = MusicTrack.STATE.PLAYING;
        this.audio.volume = 0;
        this.audio.play();
    }
}

MusicTrack.prototype.play = function(masterVolume) {
    if(this.state !== MusicTrack.STATE.PLAYING) {
        this.state = MusicTrack.STATE.PLAYING;
        this.setVolume(masterVolume);
        this.audio.play();
    }
}

MusicTrack.prototype.pause = function() {
    if(this.state !== MusicTrack.STATE.PAUSED) {
        this.state = MusicTrack.STATE.PAUSED;
        this.audio.pause();
    }
}

MusicTrack.prototype.reset = function() {
    if(this.state !== MusicTrack.STATE.NONE) {
        this.state = MusicTrack.STATE.NONE;
        this.audio.currentTime = 0;
        this.audio.pause();
    }
}

MusicTrack.prototype.mute = function() {
    if(this.state === MusicTrack.STATE.PLAYING) {
        this.audio.volume = 0;
    }
}

MusicTrack.prototype.unmute = function(masterVolume) {
    if(this.state === MusicTrack.STATE.PLAYING) {
        this.setVolume(masterVolume);
    }
}

MusicTrack.prototype.setVolume = function(masterVolume) {
    this.audio.volume = clampValue(this.volume * masterVolume, MusicTrack.VOLUME.MAX, MusicTrack.VOLUME.MIN);
}

MusicTrack.prototype.restart = function() {
    if(this.state === MusicTrack.STATE.PLAYING) {
        this.audio.currentTime = 0;
    }
}

MusicTrack.prototype.forward = function(seconds) {
    if(this.state === MusicTrack.STATE.PLAYING) {
        this.audio.currentTime += seconds;
    }
}

MusicTrack.prototype.backward = function(seconds) {
    if(this.state === MusicTrack.STATE.PLAYING) {
        const time = this.audio.currentTime - seconds;

        if(time < 0) {
            this.audio.currentTime = 0;    
        } else {
            this.audio.currentTime = time;
        }
    }
}