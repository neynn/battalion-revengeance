import { Graph } from "../graphics/graph.js";
import { isRectangleRectangleIntersect } from "../math/math.js";

export const Sprite = function(index, DEBUG_NAME) {
    Graph.call(this, DEBUG_NAME);
    
    this.index = index;
    this.texture = null;
    this.container = null;
    this.lastCallTime = 0;
    this.frameCount = 1;
    this.frameTime = 1;
    this.floatFrame = 0;
    this.currentFrame = 0;
    this.loopCount = 0;
    this.loopLimit = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.flags = Sprite.FLAG.NONE;
}

Sprite.DEBUG = {
    COLOR: "#ff00ff",
    COLOR_PIVOT: "#00ff00",
    PLACEHOLDER: "#222222",
    LINE_SIZE: 2,
    DOT_SIZE: 8,
    DOT_SIZE_HALF: 4,
    RENDER_PLACEHOLDER: 0
};

Sprite.FLAG = {
    NONE: 0,
    FLIP: 1 << 0,
    STATIC: 1 << 1,
    EXPIRE: 1 << 2,
    DESTROY: 1 << 3,
    LOOP_LOCK: 1 << 4
};

Sprite.prototype = Object.create(Graph.prototype);
Sprite.prototype.constructor = Sprite;

Sprite.prototype.onDraw = function(display, localX, localY) {
    const { context } = display;
    const isFlipped = (this.flags & Sprite.FLAG.FLIP) !== 0;

    let renderX = 0;
    let renderY = 0;

    if(isFlipped) {
        renderX = Math.floor(this.offsetX - localX);
        renderY = Math.floor(this.offsetY + localY);
        display.flip();
    } else {
        renderX = Math.floor(this.offsetX + localX);
        renderY = Math.floor(this.offsetY + localY);
        display.unflip();
    }

    if(this.texture && this.texture.bitmap) {
        const { x, y, w, h } = this.container.frames[this.currentFrame];

        context.drawImage(
            this.texture.bitmap,
            x, y, w, h,
            renderX, renderY, w, h
        );
    } else if(Sprite.DEBUG.RENDER_PLACEHOLDER) {
        context.fillStyle = Sprite.DEBUG.PLACEHOLDER;
        context.fillRect(renderX, renderY, this.width, this.height);
    }
}

Sprite.prototype.onUpdate = function(timestamp, deltaTime) {
    const passedTime = timestamp - this.lastCallTime;
    const passedFrames = passedTime / this.frameTime;

    this.lastCallTime = timestamp;

    if(!this.hasFlag(Sprite.FLAG.STATIC)) {
        this.updateFrame(passedFrames);
    }
}

Sprite.prototype.onDebug = function(display, localX, localY) {
    const { context } = display;
    const isFlipped = (this.flags & Sprite.FLAG.FLIP) !== 0;

    let renderX = 0;
    let renderY = 0;
    let pivotX = 0;

    if(isFlipped) {
        renderX = this.offsetX - localX;
        renderY = this.offsetY + localY;
        pivotX = 0 - localX;
        display.flip();
    } else {
        renderX = this.offsetX + localX;
        renderY = this.offsetY + localY;
        pivotX = localX;
        display.unflip();
    }

    context.strokeStyle = Sprite.DEBUG.COLOR;
    context.fillStyle = Sprite.DEBUG.COLOR;
    context.lineWidth = Sprite.DEBUG.LINE_SIZE;
    context.strokeRect(renderX, renderY, this.width, this.height);
    context.fillRect(renderX - Sprite.DEBUG.DOT_SIZE_HALF, renderY - Sprite.DEBUG.DOT_SIZE_HALF, Sprite.DEBUG.DOT_SIZE, Sprite.DEBUG.DOT_SIZE);
    context.fillStyle = Sprite.DEBUG.COLOR_PIVOT;
    context.fillRect(pivotX - Sprite.DEBUG.DOT_SIZE_HALF, localY - Sprite.DEBUG.DOT_SIZE_HALF, Sprite.DEBUG.DOT_SIZE, Sprite.DEBUG.DOT_SIZE);
}

Sprite.prototype.getIndex = function() {
    return this.index;
}

Sprite.prototype.reset = function() {
    this.texture = null;
    this.container = null;
    this.lastCallTime = 0;
    this.frameCount = 1;
    this.frameTime = 1;
    this.floatFrame = 0;
    this.currentFrame = 0;
    this.loopCount = 0;
    this.loopLimit = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.width = 0;
    this.height = 0;
    this.flags = Sprite.FLAG.NONE;
    this.opacity = 1;
    this.setPosition(0, 0);
    this.show();
}

Sprite.prototype.setTexture = function(texture) {
    if(texture) {
        this.texture = texture;
    }
}

Sprite.prototype.init = function(container, lastCallTime, DEBUG_NAME) {
    if(this.container !== container) {
        const { frameTime, frameCount, boundsW, boundsH, offsetX, offsetY } = container;

        this.container = container;
        this.lastCallTime = lastCallTime;
        this.frameCount = frameCount;
        this.frameTime = frameTime;
        this.floatFrame = 0;
        this.currentFrame = 0;
        this.loopCount = 0;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.width = boundsW;
        this.height = boundsH;
        this.DEBUG_NAME = DEBUG_NAME;
    }
}

Sprite.prototype.isVisibleStatic = function(positionX, positionY, viewportRight, viewportLeft, viewportBottom, viewportTop) {
    const isFlipped = (this.flags & Sprite.FLAG.FLIP) !== 0;
    const adjustedX = isFlipped ? 0 - this.offsetX - this.width : this.offsetX;
    const leftEdge = positionX + adjustedX;
    const topEdge = positionY + this.offsetY;
    const rightEdge = leftEdge + this.width;
    const bottomEdge = topEdge + this.height;
    const isVisible = leftEdge < viewportRight && rightEdge > viewportLeft && topEdge < viewportBottom && bottomEdge > viewportTop;

    return isVisible;
}

Sprite.prototype.isVisible = function(viewportRight, viewportLeft, viewportBottom, viewportTop) {
    const isFlipped = (this.flags & Sprite.FLAG.FLIP) !== 0;
    const adjustedX = isFlipped ? 0 - this.offsetX - this.width : this.offsetX;
    const leftEdge = this.positionX + adjustedX;
    const topEdge = this.positionY + this.offsetY;
    const rightEdge = leftEdge + this.width;
    const bottomEdge = topEdge + this.height;
    const isVisible = leftEdge < viewportRight && rightEdge > viewportLeft && topEdge < viewportBottom && bottomEdge > viewportTop;

    return isVisible;
}

Sprite.prototype.isCollidingStatic = function(positionX, positionY, x, y, w, h) {
    const isFlipped = (this.flags & Sprite.FLAG.FLIP) !== 0;
    const adjustedX = isFlipped ? -this.offsetX - this.width : this.offsetX;
    const isColliding = isRectangleRectangleIntersect(
        positionX + adjustedX, positionY + this.offsetY, this.width, this.height,
        x, y, w, h
    );

    return isColliding;
}

Sprite.prototype.isColliding = function(x, y, w, h) {
    const isFlipped = (this.flags & Sprite.FLAG.FLIP) !== 0;
    const adjustedX = isFlipped ? -this.offsetX - this.width : this.offsetX;
    const isColliding = isRectangleRectangleIntersect(
        this.positionX + adjustedX, this.positionY + this.offsetY, this.width, this.height,
        x, y, w, h
    );

    return isColliding;
}

Sprite.prototype.setFrame = function(frameIndex = this.currentFrame) {
    if(frameIndex < this.frameCount && frameIndex >= 0) {
        this.floatFrame = frameIndex;
        this.currentFrame = frameIndex;
    }
}

Sprite.prototype.terminate = function() {
    this.hide();
    this.freeze();
    this.flags |= Sprite.FLAG.DESTROY;
}

Sprite.prototype.hasFlag = function(flag) {
    return (this.flags & flag) !== 0;
} 

Sprite.prototype.expire = function(loops = 0) {
    this.loopLimit = this.loopCount + loops;
    this.flags |= Sprite.FLAG.EXPIRE;
}

Sprite.prototype.repeat = function() {
    this.flags &= ~Sprite.FLAG.EXPIRE;
}

Sprite.prototype.freeze = function() {
    this.flags |= Sprite.FLAG.STATIC;
}

Sprite.prototype.thaw = function() {
    this.flags &= ~Sprite.FLAG.STATIC;
}

Sprite.prototype.flip = function() {
    this.flags |= Sprite.FLAG.FLIP;
}

Sprite.prototype.unflip = function() {
    this.flags &= ~Sprite.FLAG.FLIP;
}

Sprite.prototype.lock = function() {
    this.loopCount = 0;
    this.flags |= Sprite.FLAG.LOOP_LOCK;
}

Sprite.prototype.unlock = function() {
    this.flags &= ~Sprite.FLAG.LOOP_LOCK;
}

Sprite.prototype.updateFrame = function(floatFrames) {
    if(this.loopCount > 0 && this.hasFlag(Sprite.FLAG.LOOP_LOCK)) {
        return;
    }

    this.floatFrame += floatFrames;
    this.currentFrame = Math.floor(this.floatFrame % this.frameCount);

    if(floatFrames !== 0) {
        if(this.floatFrame >= this.frameCount) {
            const skippedLoops = Math.floor(this.floatFrame / this.frameCount);

            this.floatFrame -= this.frameCount * skippedLoops;
            this.loopCount += skippedLoops;

            if(skippedLoops > 0 && this.hasFlag(Sprite.FLAG.LOOP_LOCK)) {
                this.floatFrame = this.frameCount - 1;
                this.currentFrame = this.frameCount - 1;
            }
        }

        if(this.loopCount > this.loopLimit && this.hasFlag(Sprite.FLAG.EXPIRE)) {
            this.terminate();
        }
    }
}

Sprite.prototype.setFrameTime = function(frameTime) {
    if(frameTime > 0) {
        this.frameTime = frameTime;
    }
}

Sprite.prototype.isFinished = function() {
    return this.currentFrame === (this.frameCount - 1);
}

Sprite.prototype.getTotalFrameTime = function() {
    return this.frameTime * this.frameCount;
}