export const SpriteContainer = function(id, frames) {
    this.id = id;
    this.frames = frames;
    this.frameCount = frames.length;
    this.totalFrameTime = frames.length;
    this.frameTime = 1;
    this.boundsX = 0;
    this.boundsY = 0;
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
    this.boundsX = this.shiftX;
    this.boundsY = this.shiftY;
    this.boundsW = this.frames[0].w;
    this.boundsH = this.frames[0].h;
}

SpriteContainer.prototype.loadBounds = function(bounds) {
    const { x, y, w, h } = bounds;

    this.boundsX = x ?? this.shiftX;
    this.boundsY = y ?? this.shiftY;
    this.boundsW = w ?? this.frames[0].w;
    this.boundsH = h ?? this.frames[0].h;
}

SpriteContainer.prototype.loadShift = function(shift) {
    const { x = 0, y = 0 } = shift;

    this.shiftX = x;
    this.shiftY = y;
}