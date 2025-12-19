const MAX_COLOR_VALUE = 255;

const COLOR_TYPE = {
    NONE: 0,
    R: 1,
    RG: 2,
    RGB: 3
};

const mapFrame = function(buffer, bufferWidth, colorMap, frameX, frameY, frameW, frameH) {
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

export const createBitmapData = function(bitmap) {
    const { width, height } = bitmap;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(bitmap, 0, 0);

    return ctx.getImageData(0, 0, width, height);
}

export const mapBitmap = function(imageData, colorMap) {
    const { data, width, height } = imageData;
    const copy = new Uint8ClampedArray(data.length);

    copy.set(data);
    mapFrame(copy, width, colorMap, 0, 0, width, height);

    return new ImageData(copy, width, height);
}

export const mapBitmapPartial = function(imageData, colorMap, regions) {
    const { data, width, height } = imageData;
    const copy = new Uint8ClampedArray(data.length);

    copy.set(data);

    for(const frameID in regions) {
        const { x, y, w, h } = regions[frameID];

        mapFrame(copy, width, colorMap, x, y, w, h);
    }

    return new ImageData(copy, width, height);
}

export const getRGBAString = function(r, g, b, a) {
    return `rgba(${r}, ${g}, ${b}, ${a/MAX_COLOR_VALUE})`;
}

export const getRGBAStringByArray = function(color) {
    switch(color.length) {
        case COLOR_TYPE.NONE: {
            return getRGBAString(0, 0, 0, MAX_COLOR_VALUE);
        }
        case COLOR_TYPE.R: {
            const [r] = color;
            return getRGBAString(r, 0, 0, MAX_COLOR_VALUE);
        }
        case COLOR_TYPE.RG: {
            const [r, g] = color;
            return getRGBAString(r, g, 0, MAX_COLOR_VALUE);
        }
        case COLOR_TYPE.RGB: {
            const [r, g, b] = color;
            return getRGBAString(r, g, b, MAX_COLOR_VALUE);
        }
        default: {
            const [r, g, b, a] = color;
            return getRGBAString(r, g, b, a);
        }
    }
}