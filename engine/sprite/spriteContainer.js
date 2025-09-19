export const SpriteContainer = function(id, bounds, frameTime, frames) {
    this.id = id;
    this.bounds = bounds;
    this.frameTime = frameTime;
    this.frames = frames;
    this.frameCount = frames.length;
    this.totalFrameTime = frames.length * frameTime;
}