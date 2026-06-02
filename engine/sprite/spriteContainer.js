import { TILE_HEIGHT, TILE_WIDTH } from "../engine_constants.js";

export const SpriteContainer = function(id, texture) {
    this.id = id;
    this.texture = texture;
    this.frames = [];
    this.frameCount = 0;
    this.totalFrameTime = 0;
    this.frameTime = 1;
    this.boundsW = 0;
    this.boundsH = 0;
    this.offsetX = 0;
    this.offsetY = 0;
}

SpriteContainer.prototype.loadFramesAuto = function(autoRegions) {
    const { start = 1, jump = 0, repeat = 0 } = autoRegions;

    for(let i = 0; i < repeat; i++) {
        const regionNumber = start + jump * i;
        const regionID = regionNumber + "";
        const index = this.texture.regionMap.get(regionID);

        if(index !== undefined) {
            this.frames.push(this.texture.regions[index]);
        } else {
            console.error(`Missing region error! ${regionID} in ${this.texture.name}!`);
        }
    }

    this.frameCount = this.frames.length;
    this.totalFrameTime = this.frameCount * this.frameTime;
}

SpriteContainer.prototype.loadFrames = function(regions) {
    for(let i = 0; i < regions.length; i++) {
        const regionID = regions[i];
        const index = this.texture.regionMap.get(regionID);

        if(index !== undefined) {
            this.frames.push(this.texture.regions[index]);
        } else {
            console.error(`Missing region error! ${regionID} in ${this.texture.name}!`);
        }
    }

    this.frameCount = this.frames.length;
    this.totalFrameTime = this.frameCount * this.frameTime;
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
    if(this.frameCount === 0) {
        this.boundsW = 0;
        this.boundsH = 0;
    } else {
        this.boundsW = this.frames[0].w;
        this.boundsH = this.frames[0].h;
    }
}

SpriteContainer.prototype.loadBounds = function(bounds) {
    const { w, h } = bounds;

    if(this.frameCount === 0) {
        this.boundsW = w ?? 0;
        this.boundsH = h ?? 0;
    } else {
        this.boundsW = w ?? this.frames[0].w;
        this.boundsH = h ?? this.frames[0].h;
    }
}

SpriteContainer.prototype.loadAnchor = function(anchor) {
    const { x = 0, y = 0 } = anchor;

    this.offsetX = TILE_WIDTH / 2 - x;
    this.offsetY = TILE_HEIGHT * 0.8 - y;
}

SpriteContainer.prototype.loadShift = function(shift) {
    const { x = 0, y = 0 } = shift;

    this.offsetX = x;
    this.offsetY = y;
}