import { ImageResource } from "./imageResource.js";
import { TextureRegion } from "./textureRegion.js";
import { MAX_TEXTURE_VARIANTS } from "../../engine_constants.js";

export const Texture = function(id, name, path) {
    this.id = id;
    this.name = name;
    this.path = path;
    this.width = 0;
    this.height = 0;
    this.resources = [new ImageResource()];
    this.resourceTable = new Uint8Array(MAX_TEXTURE_VARIANTS);
    this.regionMap = new Map();
    this.regions = [];
}

Texture.DEFAULT_COLOR = 0;
Texture.EMPTY_REGION = new TextureRegion(0, 0, 0, 0);
Texture.EMPTY_IMAGE = new ImageResource();

Texture.prototype.getID = function() {
    return this.id;
}

Texture.prototype.getRegion = function(index) {
    if(index < 0 || index >= this.regions.length) {
        return Texture.EMPTY_REGION;
    }

    return this.regions[index];
}

Texture.prototype.getRegionByName = function(name) {
    const index = this.regionMap.get(name);

    if(index === undefined) {
        return null;
    }

    return this.regions[index];
}

Texture.prototype.getSizeBytes = function() {
    let bytes = 0;

    for(const variant of this.resources) {
        bytes += variant.getBytes();
    }

    return bytes;
}

Texture.prototype.clear = function() {
    for(const variant of this.resources) {
        variant.clear();
    }

    this.resources.length = 1;
    this.resourceTable.fill(0);
}

Texture.prototype.getImage = function() {
    return this.resources[0];
}

Texture.prototype.getImageVariant = function(index) {
    if(index < 0 || index >= MAX_TEXTURE_VARIANTS) {
        return this.resources[0];
    }

    return this.resources[this.resourceTable[index]]
}

Texture.prototype.getOrCreateImageVariant = function(index) {
    if(index <= 0 || index >= MAX_TEXTURE_VARIANTS) {
        return this.resources[0];
    }

    if(this.resourceTable[index] !== 0) {
        return this.getImageVariant(index);
    }

    const image = new ImageResource();

    this.resourceTable[index] = this.resources.length;
    this.resources.push(image);

    return image;
}

Texture.prototype.setSize = function(width, height) {
    this.width = width;
    this.height = height;
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

        //What if h is smaller than gridHeight?

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