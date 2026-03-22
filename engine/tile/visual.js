import { TILE_MAX_FRAMES, TILE_FRAME_SIZE, TILE_WRITE_PTR_MAX } from "../engine_constants.js";
import { Texture } from "../resources/texture/texture.js";

export const TileVisual = function(id) {
    this.id = id;
    this.handle = Texture.EMPTY_HANDLE;
    this.frameTime = TileVisual.DEFAULT.FRAME_TIME;
    this.framePtr = 0;
    this.frameCount = 0;
    this.frameTimeTotal = 1;
    this.frameData = new Float32Array(TILE_FRAME_SIZE * TILE_MAX_FRAMES);
    this.jumpTable = new Uint8Array(TILE_MAX_FRAMES);
}

TileVisual.DEFAULT = {
    FRAME_TIME: 1
};

TileVisual.prototype.setHandle = function(handle) {
    this.handle = handle;
}

TileVisual.prototype.reset = function() {
    this.framePtr = 0;
}

TileVisual.prototype.update = function(timestamp) {
    const currentFrameTime = timestamp % this.frameTimeTotal;
    const frameIndex = Math.floor(currentFrameTime / this.frameTime);
    const framePtr = this.jumpTable[frameIndex] * TILE_FRAME_SIZE;

    this.framePtr = framePtr;
}

TileVisual.prototype.setFrameTime = function(frameTime) {
    if(frameTime && frameTime > 0) {
        const frameTimeTotal = frameTime * this.frameCount;

        if(frameTimeTotal <= 0) {
            this.frameTimeTotal = 1;
        } else {
            this.frameTimeTotal = frameTimeTotal;
        }

        this.frameTime = frameTime;
    }
}

TileVisual.prototype.pushElement = function(fp, x, y, w, h, ox, oy) {
    const element_count = this.frameData[fp];
    const begin_write_ptr = fp + element_count * TILE_FRAME_SIZE;
    let next_frame_ptr = fp;

    //Allows write only if in bounds.
    if(begin_write_ptr <= TILE_WRITE_PTR_MAX) {
        //begin_write_ptr is the count, which is 0 in multi-frames.
        this.frameData[begin_write_ptr + 1] = x;
        this.frameData[begin_write_ptr + 2] = y;
        this.frameData[begin_write_ptr + 3] = w;
        this.frameData[begin_write_ptr + 4] = h;
        this.frameData[begin_write_ptr + 5] = ox;
        this.frameData[begin_write_ptr + 6] = oy;

        //Updates the count of the current frame's element by 1.
        this.frameData[fp]++;
        next_frame_ptr = begin_write_ptr + TILE_FRAME_SIZE;
    }

    return next_frame_ptr;
}

TileVisual.prototype.createFrame = function(fp, frameData) {
    const { x = 0, y = 0, w = 0, h = 0, offset } = frameData;
    const offsetX = (offset?.x ?? 0);
    const offsetY = (offset?.y ?? 0);
    const next_frame_ptr = this.pushElement(fp, x, y, w, h, offsetX, offsetY);

    return next_frame_ptr;
}

TileVisual.prototype.createPattern = function(fp, patternData, regions) {
    let next_frame_ptr = fp;

    for(const { id, shiftX = 0, shiftY = 0 } of patternData) {
        const frameData = regions[id];

        if(frameData) {
            next_frame_ptr = this.createFrame(fp, frameData);

            //Updates the offset of the last element.
            this.frameData[next_frame_ptr - TILE_FRAME_SIZE + 5] += shiftX;
            this.frameData[next_frame_ptr - TILE_FRAME_SIZE + 6] += shiftY;
        }
    }

    return next_frame_ptr;
}

TileVisual.prototype.generate = function(texture, regionID) {
    const { regions = {}, patterns = {}, animations = {} } = texture;
    const frameData = regions[regionID];
    const patternData = patterns[regionID];
    const animationData = animations[regionID];
    let fp = 0;

    if(frameData) {
        this.createFrame(fp, frameData);
        this.frameCount++;
        this.setFrameTime(TileVisual.DEFAULT.FRAME_TIME);
        return;
    }

    if(patternData) {
        this.createPattern(fp, patternData, regions);
        this.frameCount++;
        this.setFrameTime(TileVisual.DEFAULT.FRAME_TIME);
        return;
    }

    if(animationData) {
        const frameTime = animationData.frameTime ?? TileVisual.DEFAULT.FRAME_TIME;
        const animationFrames = animationData.frames ?? [];

        for(const frameID of animationFrames) {
            let next_frame_ptr = fp;

            if(regions[frameID]) {
                next_frame_ptr = this.createFrame(fp, regions[frameID]);
            } else if(patterns[frameID]) {
                next_frame_ptr = this.createPattern(fp, patterns[frameID], regions);
            }

            //A frame was created if the pointers do not match!
            if(fp !== next_frame_ptr) {
                this.frameCount++;
                this.jumpTable[this.frameCount] = this.jumpTable[this.frameCount - 1] + this.frameData[fp];

                fp = next_frame_ptr;
            }
        }

        this.setFrameTime(frameTime);
    }
}