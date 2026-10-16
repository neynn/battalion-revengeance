import { TILE_HEIGHT, TILE_WIDTH } from "../engine_constants.js";

export const SpriteDefinition = function(id, texture) {
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

SpriteDefinition.prototype.loadFramesAuto = function(autoRegions) {
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

SpriteDefinition.prototype.loadFrames = function(regions) {
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

SpriteDefinition.prototype.setSpriteTime = function(spriteTime) {
    this.frameTime = spriteTime / this.frameCount;
    this.totalFrameTime = spriteTime;
}

SpriteDefinition.prototype.setFrameTime = function(frameTime) {
    this.frameTime = frameTime;
    this.totalFrameTime = frameTime * this.frameCount;
} 

SpriteDefinition.prototype.loadDefaultBounds = function() {
    if(this.frameCount === 0) {
        this.boundsW = 0;
        this.boundsH = 0;
    } else {
        this.boundsW = this.frames[0].w;
        this.boundsH = this.frames[0].h;
    }
}

SpriteDefinition.prototype.loadBounds = function(bounds) {
    const { w, h } = bounds;

    if(this.frameCount === 0) {
        this.boundsW = w ?? 0;
        this.boundsH = h ?? 0;
    } else {
        this.boundsW = w ?? this.frames[0].w;
        this.boundsH = h ?? this.frames[0].h;
    }
}

SpriteDefinition.prototype.loadAnchor = function(anchor) {
    const { x = 0, y = 0 } = anchor;

    this.offsetX = TILE_WIDTH / 2 - x;
    this.offsetY = TILE_HEIGHT * 0.8 - y;
}

SpriteDefinition.prototype.loadShift = function(shift) {
    const { x = 0, y = 0 } = shift;

    this.offsetX = x;
    this.offsetY = y;
}