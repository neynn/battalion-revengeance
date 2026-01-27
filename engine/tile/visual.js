import { TextureRegistry } from "../resources/textureRegistry.js";

export const TileVisual = function(id) {
    this.id = id;
    this.texture = TextureRegistry.EMPTY_ATLAS_TEXTURE;
    this.frames = [];
    this.frameTime = TileVisual.DEFAULT.FRAME_TIME;
    this.frameIndex = 0;
    this.frameCount = 0;
    this.frameTimeTotal = 1;
}

TileVisual.DEFAULT = {
    FRAME_TIME: 1
};

TileVisual.createComponent = function(x, y, w, h, offsetX, offsetY) {
    return {
        "frameX": x,
        "frameY": y,
        "frameW": w,
        "frameH": h,
        "shiftX": offsetX,
        "shiftY": offsetY 
    }
}

TileVisual.createFrame = function(frameData) {
    if(!frameData) {
        console.warn("FrameData does not exist!");
        return [];
    }

    const { x, y, w, h, offset } = frameData;
    const offsetX = (offset?.x ?? 0);
    const offsetY = (offset?.y ?? 0);
    const component = TileVisual.createComponent(x, y, w, h, offsetX, offsetY);
    
    return [component];
}

TileVisual.createPatternFrame = function(pattern, frames) {
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
        const component = TileVisual.createComponent(x, y, w, h, offsetX, offsetY);

        frame.push(component);
    }

    return frame;
}

TileVisual.prototype.setTexture = function(texture) {
    this.texture = texture;
}

TileVisual.prototype.getFrameTime = function() {
    return this.frameTime;
}

TileVisual.prototype.getFrameCount = function() {
    return this.frameCount;
}

TileVisual.prototype.reset = function() {
    this.frameIndex = 0;
}

TileVisual.prototype.updateFrameIndex = function(timestamp) {
    const currentFrameTime = timestamp % this.frameTimeTotal;
    const frameIndex = Math.floor(currentFrameTime / this.frameTime);

    this.frameIndex = frameIndex;
}

TileVisual.prototype.setFrameTime = function(frameTime) {
    if(frameTime && frameTime > 0) {
        this.frameTime = frameTime;
        this.updateTotalFrameTime();
    }
}

TileVisual.prototype.addFrame = function(frame) {
    if(frame && frame.length > 0) {
        this.frames.push(frame);
        this.frameCount++;
        this.updateTotalFrameTime();
    }
}

TileVisual.prototype.getFrame = function(index) {
    if(index < 0 || index >= this.frames.length) {
        return null;
    }

    return this.frames[index];
}

TileVisual.prototype.updateTotalFrameTime = function() {
    const frameTimeTotal = this.frameTime * this.frameCount;

    if(frameTimeTotal <= 0) {
        this.frameTimeTotal = 1;
    } else {
        this.frameTimeTotal = frameTimeTotal;
    }
}

//TODO: get frames from texture.
TileVisual.prototype.init = function(texture, regionID) {
    const { regions = {}, patterns = {}, animations = {} } = texture;
    const frameData = regions[regionID];

    if(frameData) {
        const frame = TileVisual.createFrame(frameData);

        this.setFrameTime(TileVisual.DEFAULT.FRAME_TIME);
        this.addFrame(frame);
        return;
    } 

    const patternData = patterns[regionID];

    if(patternData) {
        const frame = TileVisual.createPatternFrame(patternData, regions);

        this.setFrameTime(TileVisual.DEFAULT.FRAME_TIME);
        this.addFrame(frame);
        return;
    }

    const animationData = animations[regionID];

    if(animationData) {
        const frameTime = animationData.frameTime ?? TileVisual.DEFAULT.FRAME_TIME;
        const animationFrames = animationData.frames ?? [];

        this.setFrameTime(frameTime);

        for(let i = 0; i < animationFrames.length; i++) {
            const frameID = animationFrames[i];
            const frameData = regions[frameID];

            if(frameData) {
                const frame = TileVisual.createFrame(frameData);

                this.addFrame(frame);
                continue;
            }

            const patternData = patterns[frameID];

            if(patternData) {
                const frame = TileVisual.createPatternFrame(patternData, regions);

                this.addFrame(frame);
                continue;
            }
        }
    }
}