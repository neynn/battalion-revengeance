export const SpriteContainer = function(id, bounds, frames) {
    this.id = id;
    this.bounds = bounds;
    this.frames = frames;
    this.frameCount = frames.length;
    this.frameTime = 1;
    this.totalFrameTime = frames.length;
}

SpriteContainer.prototype.setSpriteTime = function(spriteTime) {
    this.frameTime = spriteTime / this.frameCount;
    this.totalFrameTime = spriteTime;
}

SpriteContainer.prototype.setFrameTime = function(frameTime) {
    this.frameTime = frameTime;
    this.totalFrameTime = frameTime * this.frameCount;
} 