import { TextureHandle } from "./textureHandle.js";
import { TextureRegion } from "./region.js";

export const Texture = function(id, name, path) {
    this.id = id;
    this.name = name;
    this.path = path;
    this.width = 0;
    this.height = 0;
    this.gridWidth = 0;
    this.gridHeight = 0;
    this.handle = new TextureHandle();
    this.variants = new Map();
    this.regionMap = new Map();
    this.regions = [];
}

Texture.EMPTY_REGION = new TextureRegion(0, 0, 0, 0);
Texture.EMPTY_HANDLE = new TextureHandle();

Texture.prototype.getRegion = function(index) {
    if(index < 0 || index >= this.regions.length) {
        return Texture.EMPTY_REGION;
    }

    return this.regions[index];
}

Texture.prototype.getRegionByName = function(name) {
    const index = this.getRegionIndex(name);

    if(index === -1) {
        return null;
    }

    return this.regions[index];
}

Texture.prototype.getRegionIndex = function(name) {
    const index = this.regionMap.get(name);

    if(index === undefined) {
        return -1;
    }

    return index;
}

Texture.prototype.getSizeBytes = function() {
    let bytes = this.handle.getBytes();

    for(const [id, variant] of this.variants) {
        bytes += variant.getBytes();
    }

    return bytes;
}

Texture.prototype.clear = function() {
    this.handle.clear();
    
    for(const [id, variant] of this.variants) {
        variant.clear();
    }

    this.variants.clear();
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
    const handle = this.variants.get(handleID);

    if(handle) {
        return handle;
    }

    const nextHandle = new TextureHandle();

    this.variants.set(handleID, nextHandle);

    return nextHandle;
}

Texture.prototype.initGrid = function(grid, gridWidth, gridHeight) {
    for(const regionID in grid) {
        const { u = 0, v = 0, h = 0 } = grid[regionID];
        let regionX = u * gridWidth;
        let regionY = v * gridHeight;
        let regionHeight = gridHeight;
        let offsetY = 0;

        //Custom height. Move one cell down and subtract the height. 
        if(h !== 0) {
            regionY += gridHeight - h;
            regionHeight = h;
            offsetY = gridHeight - h;
        }

        const region = new TextureRegion(regionX, regionY, gridWidth, regionHeight);

        region.offsetX = 0;
        region.offsetY = offsetY;

        this.regions.push(region);
        this.regionMap.set(regionID, this.regions.length - 1);
    }
}

Texture.prototype.initRegions = function(regions, gridWidth, gridHeight) {
    for(const regionID in regions) {
        if(!this.regionMap.has(regionID)) {
            const { x = 0, y = 0, w = 0, h = 0 } = regions[regionID];
            const region = new TextureRegion(x, y, w, h);
    
            this.regions.push(region);
            this.regionMap.set(regionID, this.regions.length - 1);
        }
    }
}

Texture.prototype.autoGrid = function(startX, startY, rows, columns, firstID, gridWidth, gridHeight) {
    let id = firstID;

    for(let i = 0; i < rows; i++) {
        for(let j = 0; j < columns; j++) {
            const regionX = startX + j * gridWidth;
            const regionY = startY + i * gridHeight;
            const region = new TextureRegion(regionX, regionY, gridWidth, gridHeight);
            const regionID = (id++) + "";

            this.regions.push(region);
            this.regionMap.set(regionID, this.regions.length - 1);
        }
    }
}

Texture.prototype.getFramesAuto = function(autoRegions) {
    const { start = 1, jump = 0, repeat = 0 } = autoRegions;
    const frames = [];

    for(let i = 0; i < repeat; i++) {
        const regionNumber = start + jump * i;
        const regionID = regionNumber + "";
        const index = this.regionMap.get(regionID);

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
        const index = this.regionMap.get(regionID);

        if(index !== undefined) {
            frames.push(this.regions[index]);
        } else {
            console.error(`Missing region error! ${regionID} in ${this.name}!`);
        }
    }

    return frames;
}

Texture.prototype.getHandle = function(handleID) {
    const handle = this.variants.get(handleID);

    if(!handle) {
        return this.handle;
    }

    return handle;
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

Texture.prototype.drawRect = function(display, rect, screenX, screenY) {
    const { state, bitmap } = this.handle;

    if(state === TextureHandle.STATE.LOADED) {
        const { x, y, w, h } = rect;
        const { context } = display;

        context.drawImage(
            bitmap,
            x, y, w, h,
            screenX, screenY, w, h
        );
    } 
}

Texture.prototype.drawRegion = function(display, region, screenX, screenY) {
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