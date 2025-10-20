export const MockAudio = function() {
    this.volume = 0;
    this.currentTime = 0;
}

MockAudio.prototype.play = function() {
    console.error("PLAY CALLED ON AUDIO STUB!");
}

MockAudio.prototype.pause = function() {
    console.error("PAUSE CALLED ON AUDIO STUB!");
}