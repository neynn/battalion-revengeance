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
    this.boundsX = 0;
    this.boundsY = 0;
    this.boundsW = 0;
    this.boundsH = 0;
    this.flags = Sprite.FLAG.NONE;
}

Sprite.DEBUG = {
    COLOR: "#ff00ff",
    PLACEHOLDER: "#222222",
    LINE_SIZE: 2,
    DOT_SIZE: 8,
    DOT_SIZE_HALF: 4
};

Sprite.FLAG = {
    NONE: 0b00000000,
    FLIP: 1 << 0,
    STATIC: 1 << 1,
    EXPIRE: 1 << 2,
    DESTROY: 1 << 3,
    LOOP_LOCK: 1 << 4
};

Sprite.RENDER_PLACEHOLDER = 0;

Sprite.prototype = Object.create(Graph.prototype);
Sprite.prototype.constructor = Sprite;

Sprite.prototype.onDraw = function(display, localX, localY) {
    const { context } = display;
    const isFlipped = (this.flags & Sprite.FLAG.FLIP) !== 0;

    let renderX = 0;
    let renderY = 0;

    if(isFlipped) {
        renderX = this.boundsX - localX;
        renderY = localY + this.boundsY;
        display.flip();
    } else {
        renderX = localX + this.boundsX;
        renderY = localY + this.boundsY;
        display.unflip();
    }

    if(this.texture && this.texture.bitmap) {
        const currentFrame = this.container.frames[this.currentFrame];
        const { x, y, w, h } = currentFrame;

        context.drawImage(this.texture.bitmap, x, y, w, h, renderX, renderY, w, h);
    } else if(Sprite.RENDER_PLACEHOLDER) {
        context.fillStyle = Sprite.DEBUG.PLACEHOLDER;
        context.fillRect(renderX, renderY, this.boundsW, this.boundsH);
    }
}

Sprite.prototype.onUpdate = function(timestamp, deltaTime) {
    const passedTime = timestamp - this.lastCallTime;
    const passedFrames = passedTime / this.frameTime;

    this.lastCallTime = timestamp;
    this.updateFrame(passedFrames);
}

Sprite.prototype.onDebug = function(display, localX, localY) {
    const { context } = display;
    const isFlipped = (this.flags & Sprite.FLAG.FLIP) !== 0;

    let renderX = 0;
    let renderY = 0;
    let pivotX = 0;

    if(isFlipped) {
        renderX = this.boundsX - localX;
        renderY = localY + this.boundsY;
        pivotX = 0 - localX;
        display.flip();
    } else {
        renderX = localX + this.boundsX;
        renderY = localY + this.boundsY;
        pivotX = localX;
        display.unflip();
    }

    context.strokeStyle = Sprite.DEBUG.COLOR;
    context.fillStyle = Sprite.DEBUG.COLOR;
    context.lineWidth = Sprite.DEBUG.LINE_SIZE;
    context.strokeRect(renderX, renderY, this.boundsW, this.boundsH);
    context.fillRect(renderX - Sprite.DEBUG.DOT_SIZE_HALF, renderY - Sprite.DEBUG.DOT_SIZE_HALF, Sprite.DEBUG.DOT_SIZE, Sprite.DEBUG.DOT_SIZE);
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
    this.boundsX = 0;
    this.boundsY = 0;
    this.boundsW = 0;
    this.boundsH = 0;
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
        const { frameTime, frameCount, bounds } = container;
        const { x, y, w, h } = bounds;

        this.container = container;
        this.lastCallTime = lastCallTime;
        this.frameCount = frameCount;
        this.frameTime = frameTime;
        this.floatFrame = 0;
        this.currentFrame = 0;
        this.loopCount = 0;
        this.DEBUG_NAME = DEBUG_NAME;
        this.setBounds(x, y, w, h);
    }
}

Sprite.prototype.setBounds = function(x, y, w, h) {
    this.boundsX = x;
    this.boundsY = y;
    this.boundsW = w;
    this.boundsH = h;
}

Sprite.prototype.isVisibleStatic = function(positionX, positionY, viewportRight, viewportLeft, viewportBottom, viewportTop) {
    const isFlipped = (this.flags & Sprite.FLAG.FLIP) !== 0;
    const adjustedX = isFlipped ? 0 - this.boundsX - this.boundsW : this.boundsX;
    const leftEdge = positionX + adjustedX;
    const topEdge = positionY + this.boundsY;
    const rightEdge = leftEdge + this.boundsW;
    const bottomEdge = topEdge + this.boundsH;
    const isVisible = leftEdge < viewportRight && rightEdge > viewportLeft && topEdge < viewportBottom && bottomEdge > viewportTop;

    return isVisible;
}

Sprite.prototype.isVisible = function(viewportRight, viewportLeft, viewportBottom, viewportTop) {
    const isFlipped = (this.flags & Sprite.FLAG.FLIP) !== 0;
    const adjustedX = isFlipped ? 0 - this.boundsX - this.boundsW : this.boundsX;
    const leftEdge = this.positionX + adjustedX;
    const topEdge = this.positionY + this.boundsY;
    const rightEdge = leftEdge + this.boundsW;
    const bottomEdge = topEdge + this.boundsH;
    const isVisible = leftEdge < viewportRight && rightEdge > viewportLeft && topEdge < viewportBottom && bottomEdge > viewportTop;

    return isVisible;
}

Sprite.prototype.isCollidingStatic = function(positionX, positionY, x, y, w, h) {
    const isFlipped = (this.flags & Sprite.FLAG.FLIP) !== 0;
    const adjustedX = isFlipped ? -this.boundsX - this.boundsW : this.boundsX;
    const isColliding = isRectangleRectangleIntersect(
        positionX + adjustedX, positionY + this.boundsY, this.boundsW, this.boundsH,
        x, y, w, h
    );

    return isColliding;
}

Sprite.prototype.isColliding = function(x, y, w, h) {
    const isFlipped = (this.flags & Sprite.FLAG.FLIP) !== 0;
    const adjustedX = isFlipped ? -this.boundsX - this.boundsW : this.boundsX;
    const isColliding = isRectangleRectangleIntersect(
        this.positionX + adjustedX, this.positionY + this.boundsY, this.boundsW, this.boundsH,
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

Sprite.prototype.lockLoop = function() {
    this.flags |= Sprite.FLAG.LOOP_LOCK;
}

Sprite.prototype.freeLoop = function() {
    this.flags &= ~Sprite.FLAG.LOOP_LOCK;
}

Sprite.prototype.updateFrame = function(floatFrames) {
    if(!this.hasFlag(Sprite.FLAG.STATIC)) {
        if(this.loopCount <= 0 || !this.hasFlag(Sprite.FLAG.LOOP_LOCK)) {
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
    }
}

Sprite.prototype.setFrameTime = function(frameTime) {
    if(frameTime > 0) {
        this.frameTime = frameTime;
    }
}

Sprite.prototype.hasFinishedOnce = function() {
    return this.loopCount > 0;
}