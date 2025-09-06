export const MusicTrack = function(audio, volume, isLooping) {
    this.audio = audio;
    this.volume = volume;
    this.isLooping = isLooping;
    this.state = MusicTrack.STATE.NONE;
}

MusicTrack.STATE = {
    NONE: 0,
    PAUSED: 1,
    PLAYING: 2
};

MusicTrack.prototype.playSilent = function() {
    if(this.state === MusicTrack.STATE.PLAYING) {
        return;
    }

    this.state = MusicTrack.STATE.PLAYING;
    this.audio.volume = 0;
    this.audio.play();
}

MusicTrack.prototype.play = function() {
    if(this.state === MusicTrack.STATE.PLAYING) {
        return;
    }

    this.state = MusicTrack.STATE.PLAYING;
    this.audio.volume = this.volume;
    this.audio.play();
}

MusicTrack.prototype.pause = function() {
    if(this.state === MusicTrack.STATE.PAUSED) {
        return;
    }

    this.state = MusicTrack.STATE.PAUSED;
    this.audio.pause();
}

MusicTrack.prototype.reset = function() {
    if(this.state === MusicTrack.STATE.NONE) {
        return;
    }

    this.state = MusicTrack.STATE.NONE;
    this.audio.currentTime = 0;
    this.audio.pause();
}

MusicTrack.prototype.mute = function() {
    if(this.state !== MusicTrack.STATE.PLAYING) {
        return;
    }

    this.audio.volume = 0;
}

MusicTrack.prototype.unmute = function() {
    if(this.state !== MusicTrack.STATE.PLAYING) {
        return;
    }

    this.audio.volume = this.volume;
}

MusicTrack.prototype.setVolume = function(volume) {
    let nextVolume = 0;

    if(volume > 1) {
        nextVolume = 1;
    } else if(volume < 0) {
        nextVolume = 0;
    } else {
        nextVolume = volume;
    }

    this.volume = nextVolume;
    this.audio.volume = nextVolume;
}   