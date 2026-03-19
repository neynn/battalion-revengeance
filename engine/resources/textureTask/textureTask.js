export const recolorRect = function(buffer, bufferWidth, colorMap, frameX, frameY, frameW, frameH) {
    for(let i = 0; i < frameH; i++) {
        const rowStart = (frameY + i) * bufferWidth + frameX;

        for(let j = 0; j < frameW; j++) {
            const index = (rowStart + j) * 4;

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
        }
    }
}

export const recolorImage = function(imageData, colorMap) {
    const { data, width, height } = imageData;

    recolorRect(data, width, colorMap, 0, 0, width, height);
}

export const recolorImageWithRegions = function(imageData, colorMap, regions) {
    const { data, width } = imageData;

    for(let i = 0; i < regions.length; i++) {
        const { x, y, w, h } = regions[i];

        recolorRect(data, width, colorMap, x, y, w, h);
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
    this.state = TextureTask.STATE.RUNNING;
}

TextureTask.STATE = {
    RUNNING: 0,
    FINISHED: 1
};

TextureTask.prototype.run = function() {
    this.state = TextureTask.STATE.FINISHED;
}