import { Graph } from "../graphics/graph.js";
import { isRectangleRectangleIntersect } from "../math/math.js";

export const Sprite = function(index, DEBUG_NAME) {
    Graph.call(this, DEBUG_NAME);
    
    this.index = index;
    this.container = null;
    this.lastCallTime = 0;
    this.frameCount = 0;
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
    LINE_SIZE: 2,
    DOT_SIZE: 8,
    DOT_SIZE_HALF: 4
};

Sprite.FLAG = {
    NONE: 0b00000000,
    FLIP: 1 << 0,
    STATIC: 1 << 1,
    EXPIRE: 1 << 2,
    DESTROY: 1 << 3
};

Sprite.RENDER_PLACEHOLDER = 0;

Sprite.prototype = Object.create(Graph.prototype);
Sprite.prototype.constructor = Sprite;

Sprite.prototype.onDraw = function(display, localX, localY) {
    if(!this.container) {
        if(Sprite.RENDER_PLACEHOLDER) {
            this.drawPlaceholder(display, localX, localY);
        }
        return;
    }

    const { texture, frames } = this.container;
    const { bitmap } = texture;

    if(!bitmap) {
        if(Sprite.RENDER_PLACEHOLDER) {
            this.drawPlaceholder(display, localX, localY);
        }
        return;
    }

    const currentFrame = frames[this.currentFrame];
    const isFlipped = (this.flags & Sprite.FLAG.FLIP) !== 0;

    let renderX = localX;
    let renderY = localY;

    if(isFlipped) {
        renderX = (localX - this.boundsX) * -1;
        renderY = localY + this.boundsY;
        display.flip();
    } else {
        renderX = localX + this.boundsX;
        renderY = localY + this.boundsY;
        display.unflip();
    }

    const { x, y, w, h } = currentFrame;
    const { context } = display;

    context.drawImage(bitmap, x, y, w, h, renderX, renderY, w, h);
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

    context.strokeStyle = Sprite.DEBUG.COLOR;
    context.fillStyle = Sprite.DEBUG.COLOR;
    context.lineWidth = Sprite.DEBUG.LINE_SIZE;

    if(isFlipped) {
        const drawX = localX - this.boundsX;
        const drawY = localY + this.boundsY;

        display.flip();

        context.strokeRect(-drawX, drawY, this.boundsW, this.boundsH);
        context.fillRect(-drawX - Sprite.DEBUG.DOT_SIZE_HALF, drawY - Sprite.DEBUG.DOT_SIZE_HALF, Sprite.DEBUG.DOT_SIZE, Sprite.DEBUG.DOT_SIZE);
    } else {
        const drawX = localX + this.boundsX;
        const drawY = localY + this.boundsY;

        display.unflip();

        context.strokeRect(drawX, drawY, this.boundsW, this.boundsH);
        context.fillRect(drawX - Sprite.DEBUG.DOT_SIZE_HALF, drawY - Sprite.DEBUG.DOT_SIZE_HALF, Sprite.DEBUG.DOT_SIZE, Sprite.DEBUG.DOT_SIZE);
    }
}

Sprite.prototype.drawPlaceholder = function(display, localX, localY) {
    const { context } = display;
    const isFlipped = (this.flags & Sprite.FLAG.FLIP) !== 0;

    let renderX = localX;
    let renderY = localY;

    if(isFlipped) {
        renderX = (localX - this.boundsX) * -1;
        renderY = localY + this.boundsY;
        display.flip();
    } else {
        renderX = localX + this.boundsX;
        renderY = localY + this.boundsY;
        display.unflip();
    }

    context.fillStyle = Sprite.DEBUG.COLOR;
    context.fillRect(renderX, renderY, this.boundsW, this.boundsH);
}

Sprite.prototype.getIndex = function() {
    return this.index;
}

Sprite.prototype.reset = function() {
    this.container = null;
    this.lastCallTime = 0;
    this.frameCount = 0;
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
    this.setPosition(0, 0);
    this.show();
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
    const adjustedX = isFlipped ? -this.boundsX - this.boundsW : this.boundsX;
    const leftEdge = positionX + adjustedX;
    const topEdge = positionY + this.boundsY;
    const rightEdge = leftEdge + this.boundsW;
    const bottomEdge = topEdge + this.boundsH;
    const isVisible = leftEdge < viewportRight && rightEdge > viewportLeft && topEdge < viewportBottom && bottomEdge > viewportTop;

    return isVisible;
}

Sprite.prototype.isVisible = function(viewportRight, viewportLeft, viewportBottom, viewportTop) {
    const isFlipped = (this.flags & Sprite.FLAG.FLIP) !== 0;
    const adjustedX = isFlipped ? -this.boundsX - this.boundsW : this.boundsX;
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

Sprite.prototype.updateFrame = function(floatFrames) {
    if(!this.hasFlag(Sprite.FLAG.STATIC)) {
        this.floatFrame += floatFrames;
        this.currentFrame = Math.floor(this.floatFrame % this.frameCount);

        if(floatFrames !== 0) {
            if(this.floatFrame >= this.frameCount) {
                const skippedLoops = Math.floor(this.floatFrame / this.frameCount);

                this.floatFrame -= this.frameCount * skippedLoops;
                this.loopCount += skippedLoops;
            }

            if(this.loopCount > this.loopLimit && this.hasFlag(Sprite.FLAG.EXPIRE)) {
                this.terminate();
            }
        }
    }
}

Sprite.prototype.setFrameTime = function(frameTime) {
    if(frameTime > 0) {
        this.frameTime = frameTime;
    }
}