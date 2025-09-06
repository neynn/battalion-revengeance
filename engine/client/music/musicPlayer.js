import { PathHandler } from "../../resources/pathHandler.js";
import { MusicTrack } from "./musicTrack.js";

export const MusicPlayer = function() {
    this.volume = 1;
    this.tracks = {};
    this.playlists = {};
    this.loadedTracks = new Map();
    this.previousTrack = null;
    this.currentTrack = null;
    this.playlistIndex = 0;
    this.currentPlaylist = [];
    this.state = MusicPlayer.STATE.NONE;
    this.mode = MusicPlayer.MODE.SINGLE;
}

MusicPlayer.DEBUG = 1;

MusicPlayer.MODE = {
    SINGLE: 0,
    PLAYLIST: 1
};

MusicPlayer.STATE = {
    NONE: 0,
    MUTED: 1
};

MusicPlayer.prototype.load = function(musicData) {
    if(!musicData) {
        if(MusicPlayer.DEBUG) {
            console.warn("MusicData does not exist!");
        }
        return;
    }

    const { tracks, playlists } = musicData;

    this.tracks = tracks;
    this.playlists = playlists;
}

MusicPlayer.prototype.loadTrack = function(trackID) {
    if(this.loadedTracks.has(trackID)) {
        return this.loadedTracks.get(trackID);
    }

    const meta = this.tracks[trackID];

    if(!meta) {
        if(MusicPlayer.DEBUG) {
            console.warn(`Track ${trackID} does not exist!`);
        }
        return null;
    }

    const { directory, source, volume = this.volume, isLooping = false } = meta;
    const path = PathHandler.getPath(directory, source);
    const audio = new Audio(path);
    const track = new MusicTrack(audio, volume, isLooping);

    audio.onended = () => {
        track.reset();
        this.onTrackFinish(trackID);
    }

    this.loadedTracks.set(trackID, track);
    
    return track;
}

MusicPlayer.prototype.play = function(trackID) {
    if(this.currentTrack === trackID) {
        return;
    }

    this.forceStopCurrentTrack();

    const track = this.loadTrack(trackID);

    if(!track) {
        return;
    }

    switch(this.state) {
        case MusicPlayer.STATE.NONE: {
            track.play();
            break;
        }
        case MusicPlayer.STATE.MUTED: {
            track.playSilent();
            break;
        }
    }

    this.currentTrack = trackID;

    if(MusicPlayer.DEBUG) {
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
    if(this.currentTrack) {
        const track = this.loadedTracks.get(this.currentTrack);

        this.previousTrack = this.currentTrack;
        this.currentTrack = null;

        track.reset();
    } 
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

        this.play(trackID);

        if(this.loadedTracks.has(trackID)) {
            break;
        }
    }
}

MusicPlayer.prototype.onTrackFinish = function(trackID) {
    this.previousTrack = this.currentTrack;
    this.currentTrack = null;

    switch(this.mode) {
        case MusicPlayer.MODE.SINGLE: {
            const track = this.loadedTracks.get(trackID);

            if(track.isLooping) {
                this.play(trackID);
            }

            break;
        }
        case MusicPlayer.MODE.PLAYLIST: {
            const isCurrentPlaylistTrack = this.isCurrentPlaylistTrack(trackID);

            if(isCurrentPlaylistTrack) {
                if(this.currentPlaylist.length !== 0 && this.playlistIndex === this.currentPlaylist.length) {
                    const shuffledPlaylist = this.getShuffledPlaylist(this.currentPlaylist);
        
                    this.playlistIndex = 0;
                    this.currentPlaylist = shuffledPlaylist;
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
    const meta = this.tracks[musicID];

    if(!meta) {
        if(MusicPlayer.DEBUG) {
            console.warn(`Track ${trackID} does not exist!`);
        }
        return;
    }

    this.mode = MusicPlayer.MODE.SINGLE;
    this.play(musicID);
}

MusicPlayer.prototype.playPlaylist = function(playlistID) {
    const playlist = this.playlists[playlistID];

    if(!playlist) {
        if(MusicPlayer.DEBUG) {
            console.warn(`Playlist ${playlistID} does not exist!`);
        }
        return;
    }

    const shuffledPlaylist = this.getShuffledPlaylist(playlist);

    this.stop();
    this.playlistIndex = 0;
    this.currentPlaylist = shuffledPlaylist;
    this.runPlaylist();
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

MusicPlayer.prototype.unmute = function() {
    if(this.currentTrack) {
        const track = this.loadedTracks.get(this.currentTrack);

        track.unmute();
    }

    this.state = MusicPlayer.STATE.NONE;
}

MusicPlayer.prototype.mute = function() {
    if(this.currentTrack) {
        const track = this.loadedTracks.get(this.currentTrack);

        track.mute();
    }

    this.state = MusicPlayer.STATE.MUTED;
}

MusicPlayer.prototype.forward = function(seconds) {
    if(this.currentTrack) {
        const track = this.loadedTracks.get(this.currentTrack);

        track.audio.currentTime += seconds;
    }
}

MusicPlayer.prototype.backward = function(seconds) {
    if(this.currentTrack) {
        const track = this.loadedTracks.get(this.currentTrack);
        const time = track.audio.currentTime - seconds;

        if(time < 0) {
            track.audio.currentTime = 0;    
        } else {
            track.audio.currentTime = time;
        }
    }
}

MusicPlayer.prototype.skip = function() {
    if(this.currentTrack) {
        const track = this.loadedTracks.get(this.currentTrack);

        track.reset();
        this.onTrackFinish(this.currentTrack);
    }
}

MusicPlayer.prototype.restart = function() {
    if(this.currentTrack) {
        const track = this.loadedTracks.get(this.currentTrack);

        track.audio.currentTime = 0;
    }
}

MusicPlayer.prototype.pause = function() {
    if(this.currentTrack) {
        const track = this.loadedTracks.get(this.currentTrack);

        track.pause();
    }
} 

MusicPlayer.prototype.resume = function() {
    if(this.currentTrack) {
        const track = this.loadedTracks.get(this.currentTrack);

        track.play();
    }
}

MusicPlayer.prototype.getNotInPlaylist = function() {
    const audio = new Set();

    for(const audioID in this.tracks) {
        audio.add(audioID);
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