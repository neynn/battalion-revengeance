import { DEBUG } from "../../debug.js";
import { clampValue } from "../../math/math.js";
import { PathHandler } from "../../resources/pathHandler.js";
import { MusicTrack } from "./musicTrack.js";

export const MusicPlayer = function() {
    this.masterVolume = 0.5;
    this.tracks = new Map();
    this.playlists = {};
    this.previousTrack = null;
    this.currentTrack = null;
    this.playlistIndex = 0;
    this.currentPlaylist = [];
    this.state = MusicPlayer.STATE.NONE;
    this.mode = MusicPlayer.MODE.SINGLE;
}

MusicPlayer.EMPTY_TRACK = new MusicTrack(0, false, "");

MusicPlayer.MODE = {
    SINGLE: 0,
    PLAYLIST: 1
};

MusicPlayer.STATE = {
    NONE: 0,
    MUTED: 1
};

MusicPlayer.prototype.load = function(tracks, playlists) {
    for(const trackID in tracks) {
        const { directory, source, volume = MusicTrack.VOLUME.MAX, isLooping = false } = tracks[trackID];
        const path = PathHandler.getPath(directory, source);
        const track = new MusicTrack(volume, isLooping, path);

        this.tracks.set(trackID, track);
    }

    if(playlists) {
        this.playlists = playlists;
    }
}

MusicPlayer.prototype.play = function(trackID) {
    if(this.currentTrack === trackID) {
        return;
    }

    this.forceStopCurrentTrack();

    const track = this.tracks.get(trackID);

    if(track.audio === MusicTrack.MOCK_AUDIO) {
        track.audio = new Audio(track.path);
        track.audio.onended = () => {
            track.reset();
            this.onTrackFinish(trackID);
        }
    }

    switch(this.state) {
        case MusicPlayer.STATE.NONE: {
            track.play(this.masterVolume);
            break;
        }
        case MusicPlayer.STATE.MUTED: {
            track.play(0);
            break;
        }
    }

    this.currentTrack = trackID;

    if(DEBUG.MUSIC) {
        console.log(`Now playing: ${trackID}`);
    }
}

MusicPlayer.prototype.getShuffledPlaylist = function(playlist) {
    const shuffledPlaylist = [];

    for(let i = 0; i < playlist.length; i++) {
        shuffledPlaylist.push(playlist[i]);
    }

    for(let i = shuffledPlaylist.length - 1; i >= 0; i--) {
        const target = Math.floor(Math.random() * (i + 1));
        const temp = shuffledPlaylist[i];

        shuffledPlaylist[i] = shuffledPlaylist[target];
        shuffledPlaylist[target] = temp;
    }

    return shuffledPlaylist;
}

MusicPlayer.prototype.forceStopCurrentTrack = function() {
    this.getTrack(this.currentTrack).reset();
    this.previousTrack = this.currentTrack;
    this.currentTrack = null;
}

MusicPlayer.prototype.isCurrentPlaylistTrack = function(trackID) {
    const lastIndex = this.playlistIndex - 1;

    if(lastIndex < 0 || lastIndex >= this.currentPlaylist.length) {
        return false;
    }

    const playlistTrackID = this.currentPlaylist[lastIndex];

    return playlistTrackID === trackID;
}

MusicPlayer.prototype.runPlaylist = function() {
    if(this.playlistIndex < 0 || this.playlistIndex >= this.currentPlaylist.length) {
        return;
    }

    this.mode = MusicPlayer.MODE.PLAYLIST;

    while(this.playlistIndex < this.currentPlaylist.length) {
        const trackID = this.currentPlaylist[this.playlistIndex];

        this.playlistIndex++;

        if(this.tracks.has(trackID)) {
            this.play(trackID);
        }

        if(this.currentTrack === trackID) {
            break;
        }
    }
}

MusicPlayer.prototype.onTrackFinish = function(trackID) {
    if(this.currentTrack !== trackID) {
        return;
    }

    this.previousTrack = this.currentTrack;
    this.currentTrack = null;

    switch(this.mode) {
        case MusicPlayer.MODE.SINGLE: {
            const track = this.getTrack(trackID);

            if(track.isLooping) {
                this.play(trackID);
            }

            break;
        }
        case MusicPlayer.MODE.PLAYLIST: {
            if(this.isCurrentPlaylistTrack(trackID)) {
                if(this.currentPlaylist.length !== 0 && this.playlistIndex >= this.currentPlaylist.length) {        
                    this.playlistIndex = 0;
                    this.currentPlaylist = this.getShuffledPlaylist(this.currentPlaylist);
                }
        
                setTimeout(() => this.runPlaylist(), 0);
            }

            break;
        }
    }
}

MusicPlayer.prototype.stop = function() {
    this.playlistIndex = 0;
    this.currentPlaylist = [];
    this.forceStopCurrentTrack();
}

MusicPlayer.prototype.playTrack = function(musicID) {
    if(this.tracks.has(musicID)) {
        this.mode = MusicPlayer.MODE.SINGLE;
        this.play(musicID);
    } else if(DEBUG.MUSIC) {
        console.warn(`Track ${trackID} does not exist!`);
    }
}

MusicPlayer.prototype.playPlaylist = function(playlistID) {
    const playlist = this.playlists[playlistID];

    if(playlist) {
        const shuffledPlaylist = this.getShuffledPlaylist(playlist);

        this.stop();
        this.playlistIndex = 0;
        this.currentPlaylist = shuffledPlaylist;
        this.runPlaylist();
    } else if(DEBUG.MUSIC) {
        console.warn(`Playlist ${playlistID} does not exist!`);
    }
}

MusicPlayer.prototype.playPrevious = function() {
    if(this.previousTrack) {
        this.playTrack(this.previousTrack);
    }
}

MusicPlayer.prototype.toggleMute = function() {
    switch(this.state) {
        case MusicPlayer.STATE.NONE: {
            this.mute();
            break;
        }
        case MusicPlayer.STATE.MUTED: {
            this.unmute();
            break;
        }
    }

    return this.state;
}

MusicPlayer.prototype.getTrack = function(trackID) {
    const track = this.tracks.get(trackID);

    if(!track) {
        return MusicPlayer.EMPTY_TRACK;
    }

    return track;
}

MusicPlayer.prototype.unmute = function() {
    this.getTrack(this.currentTrack).unmute(this.masterVolume);
    this.state = MusicPlayer.STATE.NONE;
}

MusicPlayer.prototype.mute = function() {
    this.getTrack(this.currentTrack).mute();
    this.state = MusicPlayer.STATE.MUTED;
}

MusicPlayer.prototype.forward = function(seconds) {
    this.getTrack(this.currentTrack).forward(seconds);
}

MusicPlayer.prototype.backward = function(seconds) {
    this.getTrack(this.currentTrack).backward(seconds);
}

MusicPlayer.prototype.restart = function() {
    this.getTrack(this.currentTrack).restart();
}

MusicPlayer.prototype.pause = function() {
    this.getTrack(this.currentTrack).pause();
} 

MusicPlayer.prototype.resume = function() {
    this.getTrack(this.currentTrack).resume();
}

MusicPlayer.prototype.skip = function() {
    if(this.currentTrack) {
        this.getTrack(this.currentTrack).reset();
        this.onTrackFinish(this.currentTrack);
    }
}

MusicPlayer.prototype.setMasterVolume = function(volume) {
    this.masterVolume = clampValue(volume, MusicTrack.VOLUME.MAX, MusicTrack.VOLUME.MIN);

    if(this.state !== MusicPlayer.STATE.MUTED) {
        this.getTrack(this.currentTrack).updateVolume(this.masterVolume);
    }
}

MusicPlayer.prototype.getNotInPlaylist = function() {
    const audio = new Set();

    for(const [name, track] of this.tracks) {
        audio.add(name);
    }

    for(const playlistID in this.playlists) {
        const playlist = this.playlists[playlistID];

        for(let i = 0; i < playlist.length; i++) {
            const audioID = playlist[i];

            if(audio.has(audioID)) {
                audio.delete(audioID);
            }
        }
    }

    return audio;
}