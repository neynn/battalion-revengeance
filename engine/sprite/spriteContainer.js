export const SpriteContainer = function(texture, bounds, frameTime) {
    this.texture = texture;
    this.bounds = bounds;
    this.frameTime = frameTime;
    this.frameCount = 0;
    this.totalFrameTime = 0;
    this.frames = [];
}

SpriteContainer.prototype.updateFrameData = function() {
    this.frameCount = this.frames.length;
    this.totalFrameTime = this.frameCount * this.frameTime;
}

SpriteContainer.prototype.initAutoFrames = function(autoFrames) {
    const { start = 1, jump = 0, repeat = 0 } = autoFrames;

    for(let i = 0; i < repeat; i++) {
        const regionID = start + jump * i;
        const region = this.texture.getRegion(regionID);

        if(region) {
            this.frames.push(region);
        } else {
            //TODO: Log region error.
        }
    }

    this.updateFrameData();

    return this.frameCount;
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

    this.updateFrameData();

    return this.frameCount;
}