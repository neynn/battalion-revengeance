import { ResourceLoader } from "../resources/resourceLoader.js";

export const TileContainer = function() {
    this.texture = ResourceLoader.EMPTY_TEXTURE;
    this.frames = [];
    this.frameTime = TileContainer.DEFAULT.FRAME_TIME;
    this.frameIndex = 0;
    this.frameCount = 0;
    this.frameTimeTotal = 1;
}

TileContainer.DEFAULT = {
    FRAME_TIME: 1
};

TileContainer.createComponent = function(x, y, w, h, offsetX, offsetY) {
    return {
        "frameX": x,
        "frameY": y,
        "frameW": w,
        "frameH": h,
        "shiftX": offsetX,
        "shiftY": offsetY 
    }
}

TileContainer.createFrame = function(frameData) {
    if(!frameData) {
        console.warn("FrameData does not exist!");
        return [];
    }

    const { x, y, w, h, offset } = frameData;
    const offsetX = (offset?.x ?? 0);
    const offsetY = (offset?.y ?? 0);
    const component = TileContainer.createComponent(x, y, w, h, offsetX, offsetY);
    
    return [component];
}

TileContainer.createPatternFrame = function(pattern, frames) {
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
        const component = TileContainer.createComponent(x, y, w, h, offsetX, offsetY);

        frame.push(component);
    }

    return frame;
}

TileContainer.prototype.setTexture = function(texture) {
    this.texture = texture;
}

TileContainer.prototype.getFrameTime = function() {
    return this.frameTime;
}

TileContainer.prototype.getFrameCount = function() {
    return this.frameCount;
}

TileContainer.prototype.updateFrameIndex = function(timestamp) {
    const currentFrameTime = timestamp % this.frameTimeTotal;
    const frameIndex = Math.floor(currentFrameTime / this.frameTime);

    this.frameIndex = frameIndex;
}

TileContainer.prototype.setFrameTime = function(frameTime) {
    if(frameTime && frameTime > 0) {
        this.frameTime = frameTime;
        this.updateTotalFrameTime();
    }
}

TileContainer.prototype.addFrame = function(frame) {
    if(frame && frame.length > 0) {
        this.frames.push(frame);
        this.frameCount++;
        this.updateTotalFrameTime();
    }
}

TileContainer.prototype.getFrame = function(index) {
    if(index < 0 || index >= this.frames.length) {
        return null;
    }

    return this.frames[index];
}

TileContainer.prototype.updateTotalFrameTime = function() {
    const frameTimeTotal = this.frameTime * this.frameCount;

    if(frameTimeTotal <= 0) {
        this.frameTimeTotal = 1;
    } else {
        this.frameTimeTotal = frameTimeTotal;
    }
}

TileContainer.prototype.init = function(atlas, graphicID) {
    const { regions = {}, patterns = {}, animations = {} } = atlas;
    const frameData = regions[graphicID];

    if(frameData) {
        const frame = TileContainer.createFrame(frameData);

        this.setFrameTime(TileContainer.DEFAULT.FRAME_TIME);
        this.addFrame(frame);
        return;
    } 

    const patternData = patterns[graphicID];

    if(patternData) {
        const frame = TileContainer.createPatternFrame(patternData, regions);

        this.setFrameTime(TileContainer.DEFAULT.FRAME_TIME);
        this.addFrame(frame);
        return;
    }

    const animationData = animations[graphicID];

    if(animationData) {
        const frameTime = animationData.frameTime ?? TileContainer.DEFAULT.FRAME_TIME;
        const animationFrames = animationData.frames ?? [];

        this.setFrameTime(frameTime);

        for(let i = 0; i < animationFrames.length; i++) {
            const frameID = animationFrames[i];
            const frameData = regions[frameID];

            if(frameData) {
                const frame = TileContainer.createFrame(frameData);

                this.addFrame(frame);
                continue;
            }

            const patternData = patterns[frameID];

            if(patternData) {
                const frame = TileContainer.createPatternFrame(patternData, regions);

                this.addFrame(frame);
                continue;
            }
        }
    }
}