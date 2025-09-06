import { Texture } from "../resources/texture.js";

export const SpriteContainer = function(texture, bounds, frameTime) {
    this.texture = texture;
    this.bounds = bounds;
    this.frameTime = frameTime;
    this.frameCount = 0;
    this.totalFrameTime = 0;
    this.frames = [];
}

SpriteContainer.copyFrom = function(texture, container) {
    const { bounds, frameTime, frameCount, totalFrameTime, frames } = container;
    const newContainer = new SpriteContainer(texture, bounds, frameTime);

    newContainer.frameCount = frameCount;
    newContainer.totalFrameTime = totalFrameTime;
    newContainer.frames = frames;

    return newContainer;
}

SpriteContainer.prototype.isEmpty = function() {
    return this.texture.isState(Texture.STATE.EMPTY);
}

SpriteContainer.prototype.isLoaded = function() {
    return this.texture.isState(Texture.STATE.LOADED);
}

SpriteContainer.prototype.isLoading = function() {
    return this.texture.isState(Texture.STATE.LOADING);
}

SpriteContainer.prototype.initFrames = function(frames) {
    for(let i = 0; i < frames.length; i++) {
        const region = this.texture.getRegion(frames[i]);

        if(region) {
            this.frames.push(region);
        } else {
            //TODO: Log region error.
        }
    }

    this.frameCount = this.frames.length;
    this.totalFrameTime = this.frameCount * this.frameTime;

    return this.frameCount;
}