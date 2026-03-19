import { TextureHandle } from "../texture/textureHandle.js";

export const recolorRect = function(buffer, bufferWidth, colorMap, frameX, frameY, frameW, frameH) {
    let rowStart = frameY * bufferWidth + frameX;
    let index = 0;

    for(let i = 0; i < frameH; i++) {
        index = rowStart * 4;

        for(let j = 0; j < frameW; j++) {
            const r = buffer[index];
            const g = buffer[index + 1];
            const b = buffer[index + 2];
            
            const colorKey = (r << 16) | (g << 8) | b;
            const mappedColor = colorMap[colorKey];

            if(mappedColor) {
                const [nr, ng, nb] = mappedColor;

                buffer[index] = nr;
                buffer[index + 1] = ng;
                buffer[index + 2] = nb;
            }

            index += 4;
        }

        rowStart += bufferWidth;
    }
}

export const createImageData = function(bitmap) {
    const { width, height } = bitmap;
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d");

    context.imageSmoothingEnabled = false;
    context.drawImage(bitmap, 0, 0);

    const imageData = context.getImageData(0, 0, width, height);

    return imageData;
}

export const createEmptyImageData = function(width, height, bitmap, copyX, copyY) {
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d");

    context.imageSmoothingEnabled = false;
    context.drawImage(
        bitmap, 
        copyX, copyY, width, height,
        0, 0, width, height
    );

    const imageData = context.getImageData(0, 0, width, height);

    return imageData;
}

export const TextureTask = function(texture, handle) {
    this.texture = texture;
    this.handle = handle;
    this.state = TextureTask.STATE.NOT_STARTED;
}

TextureTask.STATE = {
    NOT_STARTED: 0,
    RUNNING: 1,
    FINISHED: 2
};

TextureTask.prototype.execute = function() {
    this.state = TextureTask.STATE.FINISHED;
}

TextureTask.prototype.run = function() {
    if(this.state === TextureTask.STATE.NOT_STARTED) {
        if(this.texture.handle.state === TextureHandle.STATE.LOADED) {
            if(this.handle.state === TextureHandle.STATE.EMPTY) {
                this.state = TextureTask.STATE.RUNNING;
                this.execute();
            }
        }
    }
}

TextureTask.prototype.isFinished = function() {
    return this.state === TextureTask.STATE.FINISHED || this.handle.state === TextureHandle.STATE.LOADED;
}