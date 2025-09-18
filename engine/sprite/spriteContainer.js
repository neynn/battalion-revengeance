export const SpriteContainer = function(bounds, frameTime, frames) {
    this.bounds = bounds;
    this.frameTime = frameTime;
    this.frames = frames;
    this.frameCount = frames.length;
    this.totalFrameTime = frames.length * frameTime;
}