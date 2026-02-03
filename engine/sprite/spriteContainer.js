export const SpriteContainer = function(id, frames) {
    this.id = id;
    this.frames = frames;
    this.frameCount = frames.length;
    this.totalFrameTime = frames.length;
    this.frameTime = 1;
    this.boundsW = 0;
    this.boundsH = 0;
    this.shiftX = 0;
    this.shiftY = 0;
}

SpriteContainer.prototype.setSpriteTime = function(spriteTime) {
    this.frameTime = spriteTime / this.frameCount;
    this.totalFrameTime = spriteTime;
}

SpriteContainer.prototype.setFrameTime = function(frameTime) {
    this.frameTime = frameTime;
    this.totalFrameTime = frameTime * this.frameCount;
} 

SpriteContainer.prototype.loadDefaultBounds = function() {
    this.boundsW = this.frames[0].w;
    this.boundsH = this.frames[0].h;
}

SpriteContainer.prototype.loadBounds = function(bounds) {
    const { w, h } = bounds;

    this.boundsW = w ?? this.frames[0].w;
    this.boundsH = h ?? this.frames[0].h;
}

SpriteContainer.prototype.loadPivot = function(pivot) {
    const { x = 0, y = 0 } = pivot;

    if(x !== 0) {
        this.shiftX = Math.floor((this.boundsW / 2)) - x;
    }

    if(y !== 0) {
        this.shiftY = Math.floor((this.boundsH / 2)) - y;
    }
}

SpriteContainer.prototype.loadShift = function(shift) {
    const { x = 0, y = 0 } = shift;

    this.shiftX = x;
    this.shiftY = y;
}