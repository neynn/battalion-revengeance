import { TextureHandle } from "./textureHandle.js";
import { TextureRegion } from "./region.js";

const recolorRect = function(buffer, bufferWidth, colorMap, frameX, frameY, frameW, frameH) {
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

const recolorImage = function(imageData, colorMap) {
    const { data, width, height } = imageData;

    recolorRect(data, width, colorMap, 0, 0, width, height);
}

const recolorImageWithRegions = function(imageData, colorMap, regions) {
    const { data, width } = imageData;

    for(let i = 0; i < regions.length; i++) {
        const { x, y, w, h } = regions[i];

        recolorRect(data, width, colorMap, x, y, w, h);
    }
}

const createImageData = function(bitmap) {
    const { width, height } = bitmap;
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d");

    context.imageSmoothingEnabled = false;
    context.drawImage(bitmap, 0, 0);

    const imageData = context.getImageData(0, 0, width, height);

    return imageData;
}

export const Texture = function(id, name, path) {
    this.id = id;
    this.name = name;
    this.path = path;
    this.handle = new TextureHandle(id);
    this.variants = [];
    this.regions = [];
    this.regionMap = {};
}

Texture.EMPTY_HANDLE = new TextureHandle(-1);

Texture.COPY_TYPE = {
    FULL: 0,
    REGIONAL: 1
};

Texture.prototype.getSizeBytes = function() {
    let bytes = this.handle.getBytes();

    for(let i = 0; i < this.variants.length; i++) {
        bytes += this.variants[i].getBytes();
    }

    return bytes;
}

Texture.prototype.clear = function() {
    this.handle.clear();
    
    for(let i = 0; i < this.variants.length; i++) {
        this.variants[i].clear();
    }

    this.variants.length = 0;
}

Texture.prototype.requestBitmap = function() {
    if(!this.path) {
        return Promise.reject("Missing path!");
    }

    if(this.handle.state !== TextureHandle.STATE.EMPTY) {
        return Promise.reject("Texture is loading/loaded!");
    }

    this.handle.state = TextureHandle.STATE.LOADING;

    return fetch(this.path)
    .then((response) => {
        if(response.ok) {
            return response.blob();
        }

        return Promise.reject("File could not be fetched!");
    })
    .then((blob) => createImageBitmap(blob))
    .then((bitmap) => {
        this.handle.setImage(bitmap);
    
        return Promise.resolve(bitmap);
    })
    .catch((error) => {
        this.handle.state = TextureHandle.STATE.EMPTY;

        return Promise.reject(error);
    });
};

Texture.prototype.getID = function() {
    return this.id;
}

Texture.prototype.createHandle = function(handleID) {
    for(let i = 0; i < this.variants.length; i++) {
        if(this.variants[i].id === handleID) {
            return this.variants[i];
        }
    }

    const handle = new TextureHandle(handleID);

    this.variants.push(handle);

    return handle;
}

Texture.prototype.loadHandle = function(handleID, schema, copyType) {
    const handle = this.getHandle(handleID);

    if(handle === this.handle) {
        return;
    }

    if(handle.state === TextureHandle.STATE.EMPTY) {
        handle.state = TextureHandle.STATE.LOADING;

        const imageData = createImageData(this.handle.bitmap);

        switch(copyType) {
            case Texture.COPY_TYPE.FULL: {
                recolorImage(imageData, schema);
                break;
            }
            case Texture.COPY_TYPE.REGIONAL: {
                recolorImageWithRegions(imageData, schema, this.regions);
                break;
            }
        }

        createImageBitmap(imageData)
        .then(bitmap => handle.setImage(bitmap))
        .catch(error => handle.clear());
    }
}

Texture.prototype.initRegions = function(regions) {
    for(const regionID in regions) {
        const { x = 0, y = 0, w = 0, h = 0 } = regions[regionID];
        const region = new TextureRegion(x, y, w, h);

        this.regions.push(region);
        this.regionMap[regionID] = this.regions.length - 1;
    }
}

Texture.prototype.autoCalcRegions = function(startX, startY, frameWidth, frameHeight, rows, columns) {
    let id = 1;

    for(let i = 0; i < rows; i++) {
        for(let j = 0; j < columns; j++) {
            const regionX = startX + j * frameWidth;
            const regionY = startY + i * frameHeight;
            const region = new TextureRegion(regionX, regionY, frameWidth, frameHeight);

            this.regions.push(region);
            this.regionMap[id++] = this.regions.length - 1;
        }
    }
}

Texture.prototype.getFramesAuto = function(autoRegions) {
    const { start = 1, jump = 0, repeat = 0 } = autoRegions;
    const frames = [];

    for(let i = 0; i < repeat; i++) {
        const regionID = start + jump * i;
        const index = this.regionMap[regionID];

        if(index !== undefined) {
            frames.push(this.regions[index]);
        } else {
            console.error(`Missing region error! ${regionID} in ${this.name}!`);
        }
    }

    return frames;
}

Texture.prototype.getFrames = function(regions) {
    const frames = [];

    for(let i = 0; i < regions.length; i++) {
        const regionID = regions[i];
        const index = this.regionMap[regionID];

        if(index !== undefined) {
            frames.push(this.regions[index]);
        } else {
            console.error(`Missing region error! ${regionID} in ${this.name}!`);
        }
    }

    return frames;
}

Texture.prototype.getHandle = function(handleID) {
    for(let i = 0; i < this.variants.length; i++) {
        if(this.variants[i].id === handleID) {
            return this.variants[i];
        }
    }

    return this.handle;
}