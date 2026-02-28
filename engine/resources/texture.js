import { createBitmapData, mapBitmap, mapBitmapPartial } from "../graphics/colorHelper.js";
import { TextureHandle } from "./texture/textureHandle.js";
import { TextureRegion } from "./texture/region.js";

export const Texture = function(id, name, path) {
    this.id = id;
    this.name = name;
    this.path = path;
    this.handle = new TextureHandle(id);
    this.variants = [];
    this.regions = [];
    this.regionMap = {};
}

Texture.COPY_TYPE = {
    FULL: 0,
    REGIONAL: 1
};

Texture.ERROR_CODE = {
    NONE: "NONE",
    ERROR_RESPONSE: "LOAD_ERROR",
    ERROR_NO_PATH: "NO_PATH",
    ERROR_STATE: "ERROR_STATE"
};

Texture.createImageData = function(bitmap) {
    const { width, height } = bitmap;
    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    context.imageSmoothingEnabled = false;
    context.drawImage(bitmap, 0, 0);

    const imageData = context.getImageData(0, 0, width, height);
    const pixelArray = imageData.data;

    return pixelArray;
}

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
        return Promise.reject(Texture.ERROR_CODE.ERROR_NO_PATH);
    }

    if(this.handle.state !== TextureHandle.STATE.EMPTY) {
        return Promise.reject(Texture.ERROR_CODE.ERROR_STATE);
    }

    this.handle.state = TextureHandle.STATE.LOADING;

    return fetch(this.path)
    .then((response) => {
        if(response.ok) {
            return response.blob();
        }

        return Promise.reject(Texture.ERROR_CODE.ERROR_RESPONSE);
    })
    .then((blob) => createImageBitmap(blob))
    .then((bitmap) => {
        this.setBitmapData(bitmap);
    
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

Texture.prototype.setBitmapData = function(bitmap) {
    this.handle.bitmap = bitmap;
    this.handle.state = TextureHandle.STATE.LOADED;
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

        const bitmapData = createBitmapData(this.handle.bitmap);
        const mappedData = copyType === Texture.COPY_TYPE.FULL ? mapBitmap(bitmapData, schema) : mapBitmapPartial(bitmapData, schema, this.regions);

        createImageBitmap(mappedData)
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