import { DEFAULT_IMAGE_TYPE } from "../../engine_constants.js";
import { EventEmitter } from "../../events/eventEmitter.js";
import { PathHandler } from "../pathHandler.js";
import { ImageResource } from "./imageResource.js";
import { Texture } from "./texture.js";

export const TextureRegistry = function() {
    this.textures = [];
    this.registries = [];

    this.events = new EventEmitter();
    this.events.register(TextureRegistry.EVENT.BITMAP_LOAD);
    this.events.register(TextureRegistry.EVENT.LOAD_ERROR);

    for(let i = 0; i < TextureRegistry.CATEGORY._COUNT; i++) {
        this.registries[i] = new Map();
    }
}

TextureRegistry.EVENT = {
    BITMAP_LOAD: 0,
    LOAD_ERROR: 1
};

TextureRegistry.CATEGORY = {
    TILE: 0,
    SPRITE: 1,
    GUI: 2,
    _COUNT: 3
};

TextureRegistry.INVALID_ID = -1;
TextureRegistry.EMPTY_TEXTURE = new Texture(TextureRegistry.INVALID_ID, "EMPTY_TEXTURE", "");

TextureRegistry.prototype.requestBitmap = function(path) {
    return fetch(path)
    .then((response) => {
        if(response.ok) {
            return response.blob();
        }

        return Promise.reject("File could not be fetched!");
    })
    .then((blob) => createImageBitmap(blob))
    .then((bitmap) => Promise.resolve(bitmap))
    .catch((error) => Promise.reject(error));
}

TextureRegistry.prototype.getKBUsed = function() {
    return Math.ceil(this.getBytesUsed() / 1024);
}

TextureRegistry.prototype.getBytesUsed = function() {
    let bytes = 0;

    for(let i = 0; i < this.textures.length; i++) {
        bytes += this.textures[i].getSizeBytes();
    }

    return bytes;
}

TextureRegistry.prototype.clearCategory = function(categoryID) {
    if(categoryID < 0 || categoryID >= TextureRegistry.CATEGORY._COUNT) {
        return;
    }

    this.registries[categoryID].forEach(textureID => this.textures[textureID].clear());
}

TextureRegistry.prototype.loadTexture = function(textureID) {
    const texture = this.getTexture(textureID);

    if(!texture) {
        return;
    }
    
    const image = texture.getImage();

    if(image.state !== ImageResource.STATE.EMPTY) {
        return;
    }

    if(!texture.path) {
        return;
    }

    image.state = ImageResource.STATE.LOADING;

    this.requestBitmap(texture.path)
    .then((bitmap) => {
        const { width, height } = bitmap;

        image.setData(bitmap);
        texture.setSize(width, height);
        
        this.events.emit(TextureRegistry.EVENT.BITMAP_LOAD, {
            "texture": texture,
            "bitmap": bitmap
        });
    })
    .catch((error) => {
        image.state = ImageResource.STATE.EMPTY;

        this.events.emit(TextureRegistry.EVENT.LOAD_ERROR, {
            "texture": texture,
            "error": error
        });
    });
}

/**
 * 
 * @param {number} categoryID 
 * @param {string} name 
 * @returns {number}
 */
TextureRegistry.prototype.getTextureID = function(categoryID, name) {
    if(categoryID < 0 || categoryID >= this.registries.length) {
        return TextureRegistry.INVALID_ID;
    }

    const textureID = this.registries[categoryID].get(name);

    if(textureID === undefined) {
        return TextureRegistry.INVALID_ID;
    }

    return textureID;
}

/**
 * 
 * @param {number} categoryID 
 * @param {object} textures 
 * @returns 
 */
TextureRegistry.prototype.createTextures = function(categoryID, textures) {
    if(categoryID < 0 || categoryID >= this.registries.length) {
        return;
    }

    for(const textureName in textures) {
        const { directory, source, grid, autoGrid, regions, gridWidth = 0, gridHeight = 0 } = textures[textureName];
        const fileName = source ? source : `${textureName}${DEFAULT_IMAGE_TYPE}`;
        const filePath = PathHandler.getPath(directory, fileName);
        const textureID = this.textures.length;
        const texture = new Texture(textureID, textureName, filePath);

        if(grid) {
            texture.initGrid(grid, gridWidth, gridHeight);
        } else if(autoGrid) {
            const { startX = 0, startY = 0, rows = 0, columns = 0, first = 1 } = autoGrid;

            texture.autoGrid(startX, startY, rows, columns, first, gridWidth, gridHeight);
        }
        
        if(regions) {
            texture.initRegions(regions, gridWidth, gridHeight);
        }

        this.textures.push(texture);
        this.registries[categoryID].set(textureName, textureID);
    }
}

TextureRegistry.prototype.getTextureWithFallback = function(index) {
    if(index < 0 || index >= this.textures.length) {
        return TextureRegistry.EMPTY_TEXTURE;
    }

    return this.textures[index];
}

/**
 * 
 * @param {*} index 
 * @returns {Texture}
 */
TextureRegistry.prototype.getTexture = function(index) {
    if(index < 0 || index >= this.textures.length) {
        return null;
    }

    return this.textures[index];
}

TextureRegistry.prototype.clear = function() {
    for(let i = 0; i < this.textures.length; i++) {
        this.textures[i].clear();
    }
}