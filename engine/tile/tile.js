import { TextureRegistry } from "../resources/textureRegistry.js";

export const Tile = function(id, cID, type, autotiler) {
    this.id = id;
    this.cID = cID;
    this.type = type;
    this.autotiler = autotiler;
    this.texture = TextureRegistry.EMPTY_ATLAS_TEXTURE;
    this.frames = [];
    this.frameTime = Tile.DEFAULT.FRAME_TIME;
    this.frameIndex = 0;
    this.frameCount = 0;
    this.frameTimeTotal = 1;
}

Tile.DEFAULT = {
    FRAME_TIME: 1
};

Tile.createComponent = function(x, y, w, h, offsetX, offsetY) {
    return {
        "frameX": x,
        "frameY": y,
        "frameW": w,
        "frameH": h,
        "shiftX": offsetX,
        "shiftY": offsetY 
    }
}

Tile.createFrame = function(frameData) {
    if(!frameData) {
        console.warn("FrameData does not exist!");
        return [];
    }

    const { x, y, w, h, offset } = frameData;
    const offsetX = (offset?.x ?? 0);
    const offsetY = (offset?.y ?? 0);
    const component = Tile.createComponent(x, y, w, h, offsetX, offsetY);
    
    return [component];
}

Tile.createPatternFrame = function(pattern, frames) {
    const frame = [];

    if(!pattern) {
        return frame;
    }

    for(let i = 0; i < pattern.length; i++) {
        const { id, shiftX, shiftY } = pattern[i];
        const frameData = frames[id];

        if(!frameData) {
            console.warn(`Frame ${id} does not exist!`);
            continue;
        }

        const { x, y, w, h, offset } = frameData;
        const offsetX = (offset?.x ?? 0) + (shiftX ?? 0);
        const offsetY = (offset?.y ?? 0) + (shiftY ?? 0);
        const component = Tile.createComponent(x, y, w, h, offsetX, offsetY);

        frame.push(component);
    }

    return frame;
}

Tile.prototype.setTexture = function(texture) {
    this.texture = texture;
}

Tile.prototype.getFrameTime = function() {
    return this.frameTime;
}

Tile.prototype.getFrameCount = function() {
    return this.frameCount;
}

Tile.prototype.reset = function() {
    this.frameIndex = 0;
}

Tile.prototype.updateFrameIndex = function(timestamp) {
    const currentFrameTime = timestamp % this.frameTimeTotal;
    const frameIndex = Math.floor(currentFrameTime / this.frameTime);

    this.frameIndex = frameIndex;
}

Tile.prototype.setFrameTime = function(frameTime) {
    if(frameTime && frameTime > 0) {
        this.frameTime = frameTime;
        this.updateTotalFrameTime();
    }
}

Tile.prototype.addFrame = function(frame) {
    if(frame && frame.length > 0) {
        this.frames.push(frame);
        this.frameCount++;
        this.updateTotalFrameTime();
    }
}

Tile.prototype.getFrame = function(index) {
    if(index < 0 || index >= this.frames.length) {
        return null;
    }

    return this.frames[index];
}

Tile.prototype.updateTotalFrameTime = function() {
    const frameTimeTotal = this.frameTime * this.frameCount;

    if(frameTimeTotal <= 0) {
        this.frameTimeTotal = 1;
    } else {
        this.frameTimeTotal = frameTimeTotal;
    }
}

//TODO: get frames from texture.
Tile.prototype.init = function(texture, regionID) {
    const { regions = {}, patterns = {}, animations = {} } = texture;
    const frameData = regions[regionID];

    if(frameData) {
        const frame = Tile.createFrame(frameData);

        this.setFrameTime(Tile.DEFAULT.FRAME_TIME);
        this.addFrame(frame);
        return;
    } 

    const patternData = patterns[regionID];

    if(patternData) {
        const frame = Tile.createPatternFrame(patternData, regions);

        this.setFrameTime(Tile.DEFAULT.FRAME_TIME);
        this.addFrame(frame);
        return;
    }

    const animationData = animations[regionID];

    if(animationData) {
        const frameTime = animationData.frameTime ?? Tile.DEFAULT.FRAME_TIME;
        const animationFrames = animationData.frames ?? [];

        this.setFrameTime(frameTime);

        for(let i = 0; i < animationFrames.length; i++) {
            const frameID = animationFrames[i];
            const frameData = regions[frameID];

            if(frameData) {
                const frame = Tile.createFrame(frameData);

                this.addFrame(frame);
                continue;
            }

            const patternData = patterns[frameID];

            if(patternData) {
                const frame = Tile.createPatternFrame(patternData, regions);

                this.addFrame(frame);
                continue;
            }
        }
    }
}