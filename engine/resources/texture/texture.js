import { TextureHandle } from "./textureHandle.js";
import { TextureRegion } from "./region.js";

export const Texture = function(id, name, path) {
    this.id = id;
    this.name = name;
    this.path = path;
    this.width = 0;
    this.height = 0;
    this.handle = new TextureHandle(id);
    this.variants = [];
    this.regions = [];
    this.regionMap = {};
}

Texture.EMPTY_HANDLE = new TextureHandle(-1);

Texture.prototype.getRegionByName = function(name) {
    const index = this.getRegionIndex(name);

    if(index === -1) {
        return null;
    }

    return this.regions[index];
}

Texture.prototype.getRegionIndex = function(name) {
    const index = this.regionMap[name];

    if(index === undefined) {
        return -1;
    }

    return index;
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
        this.width = bitmap.width;
        this.height = bitmap.height;

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

Texture.prototype.initGrid = function(grid, width, height) {
    for(const regionID in grid) {
        const { u, v } = grid[regionID];
        const region = new TextureRegion(u * width, v * height, width, height);

        this.regions.push(region);
        this.regionMap[regionID] = this.regions.length - 1;
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

Texture.prototype.autoGrid = function(startX, startY, rows, columns, firstID, width, height) {
    let id = firstID;

    for(let i = 0; i < rows; i++) {
        for(let j = 0; j < columns; j++) {
            const regionX = startX + j * width;
            const regionY = startY + i * height;
            const region = new TextureRegion(regionX, regionY, width, height);

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

Texture.prototype.drawOffset = function(display, screenX, screenY) {
    const { state, width, height, bitmap } = this.handle;

    if(state === TextureHandle.STATE.LOADED) {
        const { context } = display;

        context.drawImage(
            bitmap,
            0, 0, width, height,
            screenX - width, screenY - height, width, height
        );
    }
}

Texture.prototype.drawRegion = function(region, display, screenX, screenY) {
    const { state, bitmap } = this.handle;

    if(state === TextureHandle.STATE.LOADED) {
        if(region >= 0 && region < this.regions.length) {
            const { x, y, w, h } = this.regions[region];
            const { context } = display;

            context.drawImage(
                bitmap,
                x, y, w, h,
                screenX, screenY, w, h
            );
        }
    } 
}

Texture.prototype.draw = function(display, screenX, screenY) {
    const { state, bitmap } = this.handle;

    if(state === TextureHandle.STATE.LOADED) {
        const { context } = display;

        context.drawImage(
            bitmap,
            0, 0, this.width, this.height,
            screenX, screenY, this.width, this.height
        );
    }
}