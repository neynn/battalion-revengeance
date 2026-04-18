import { TextureHandle } from "../resources/texture/textureHandle.js";
import { SpriteManager } from "./spriteManager.js";

const DEBUG_DRAW_PLACEHOLDER = false;

export const RenderState = function(index) {
    this.index = index;
    this.lastCallTime = 0;
    this.frameCount = 1;
    this.frameTime = 1;
    this.floatFrame = 0;
    this.currentFrame = 0;
    this.loopCount = 0;
    this.loopLimit = 0;
    this.scale = 1;
    this.lastContainer = SpriteManager.INVALID_ID;
    this.flags = RenderState.FLAG.NONE;
}

RenderState.FLAG = {
    NONE: 0,
    FLIP: 1 << 0,
    STATIC: 1 << 1,
    EXPIRE: 1 << 2,
    DESTROY: 1 << 3,
    LOOP_LOCK: 1 << 4,
    HIDDEN: 1 << 5
};

RenderState.prototype.draw = function(display, container, handle, screenX, screenY) {
    const { context } = display;
    const { offsetX, offsetY, boundsW, boundsH, frames } = container;
    const { state, bitmap } = handle;
    const isFlipped = (this.flags & RenderState.FLAG.FLIP) !== 0;

    let renderX = 0;
    let renderY = 0;

    if(isFlipped) {
        renderX = Math.floor(offsetX * this.scale - screenX);
        renderY = Math.floor(offsetY * this.scale + screenY);
        display.flip();
    } else {
        renderX = Math.floor(offsetX * this.scale + screenX);
        renderY = Math.floor(offsetY * this.scale + screenY);
        display.unflip();
    }

    if(state === TextureHandle.STATE.LOADED) {
        const { x, y, w, h } = frames[this.currentFrame];

        context.drawImage(
            bitmap,
            x, y, w, h,
            renderX, renderY, w * this.scale, h * this.scale
        );
    } else {
        if(DEBUG_DRAW_PLACEHOLDER) {
            context.fillStyle = "#222222"
            context.fillRect(renderX, renderY, width * this.scale, height * this.scale);
        }
    }
}

RenderState.prototype.getIndex = function() {
    return this.index;
}

RenderState.prototype.update = function(container, timestamp, deltaTime) {
    if(this.lastContainer !== container.id) {
        this.init(container, timestamp);
        this.lastCallTime = timestamp - deltaTime;
    }

    const passedTime = timestamp - this.lastCallTime;
    const passedFrames = passedTime / this.frameTime;

    this.lastCallTime = timestamp;

    if(!this.hasFlag(RenderState.FLAG.STATIC)) {
        this.updateFrame(passedFrames);
    }
}

RenderState.prototype.reset = function() {
    this.lastCallTime = 0;
    this.frameCount = 1;
    this.frameTime = 1;
    this.floatFrame = 0;
    this.currentFrame = 0;
    this.loopCount = 0;
    this.loopLimit = 0;
    this.lastContainer = SpriteManager.INVALID_ID;
    this.flags = RenderState.FLAG.NONE;
}

RenderState.prototype.init = function(container) {
    const { id, frameTime, frameCount } = container;

    this.lastContainer = id;
    this.frameCount = frameCount;
    this.frameTime = frameTime;
    this.floatFrame = 0;
    this.currentFrame = 0;
    this.loopCount = 0;
}

RenderState.prototype.setFrame = function(frameIndex = this.currentFrame) {
    if(frameIndex < this.frameCount && frameIndex >= 0) {
        this.floatFrame = frameIndex;
        this.currentFrame = frameIndex;
    }
}

RenderState.prototype.getFrame = function(realTime) {
    const currentFrameTime = realTime % (this.frameCount * this.frameTime);
    const frameIndex = Math.floor(currentFrameTime / this.frameTime);

    return frameIndex;
}

RenderState.prototype.updateFrame = function(floatFrames) {
    if(this.loopCount > 0 && this.hasFlag(RenderState.FLAG.LOOP_LOCK)) {
        return;
    }

    this.floatFrame += floatFrames;
    this.currentFrame = Math.floor(this.floatFrame % this.frameCount);

    if(floatFrames !== 0) {
        if(this.floatFrame >= this.frameCount) {
            const skippedLoops = Math.floor(this.floatFrame / this.frameCount);

            this.floatFrame -= this.frameCount * skippedLoops;
            this.loopCount += skippedLoops;

            if(skippedLoops > 0 && this.hasFlag(RenderState.FLAG.LOOP_LOCK)) {
                this.floatFrame = this.frameCount - 1;
                this.currentFrame = this.frameCount - 1;
            }
        }

        if(this.loopCount > this.loopLimit && this.hasFlag(RenderState.FLAG.EXPIRE)) {
            this.terminate();
        }
    }
}

RenderState.prototype.setFrameTime = function(frameTime) {
    if(frameTime > 0) {
        this.frameTime = frameTime;
    }
}

RenderState.prototype.isFinished = function() {
    return this.currentFrame === (this.frameCount - 1);
}

RenderState.prototype.getTotalFrameTime = function() {
    return this.frameTime * this.frameCount;
}

RenderState.prototype.terminate = function() {
    this.hide();
    this.freeze();
    this.flags |= RenderState.FLAG.DESTROY;
}

RenderState.prototype.hasFlag = function(flag) {
    return (this.flags & flag) !== 0;
} 

RenderState.prototype.expire = function(loops = 0) {
    this.loopLimit = this.loopCount + loops;
    this.flags |= RenderState.FLAG.EXPIRE;
}

RenderState.prototype.repeat = function() {
    this.flags &= ~RenderState.FLAG.EXPIRE;
}

RenderState.prototype.freeze = function() {
    this.flags |= RenderState.FLAG.STATIC;
}

RenderState.prototype.thaw = function() {
    this.flags &= ~RenderState.FLAG.STATIC;
}

RenderState.prototype.flip = function() {
    this.flags |= RenderState.FLAG.FLIP;
}

RenderState.prototype.unflip = function() {
    this.flags &= ~RenderState.FLAG.FLIP;
}

RenderState.prototype.lock = function() {
    this.loopCount = 0;
    this.flags |= RenderState.FLAG.LOOP_LOCK;
}

RenderState.prototype.unlock = function() {
    this.flags &= ~RenderState.FLAG.LOOP_LOCK;
}

RenderState.prototype.show = function() {
    this.flags &= ~RenderState.FLAG.HIDDEN;
}

RenderState.prototype.hide = function() {
    this.flags |= RenderState.FLAG.HIDDEN;
}