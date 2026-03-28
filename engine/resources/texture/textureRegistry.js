import { PathHandler } from "../pathHandler.js";
import { Texture } from "./texture.js";

const DEFAULT_TEXTURE_TYPE = ".png";

export const TextureRegistry = function() {
    this.textures = [];
}

TextureRegistry.INVALID_ID = -1;
TextureRegistry.EMPTY_TEXTURE = new Texture(TextureRegistry.INVALID_ID, "EMPTY_TEXTURE", "");

TextureRegistry.prototype.getSizeBytes = function() {
    let bytes = 0;

    for(let i = 0; i < this.textures.length; i++) {
        bytes += this.textures[i].getSizeBytes();
    }

    return bytes;
}

TextureRegistry.prototype.createTextures = function(textures) {
    const textureMap = {};

    for(const textureName in textures) {
        const { directory, source, grid, autoGrid, regions, gridWidth = 0, gridHeight = 0 } = textures[textureName];
        const fileName = source ? source : `${textureName}${DEFAULT_TEXTURE_TYPE}`;
        const filePath = PathHandler.getPath(directory, fileName);
        const textureID = this.textures.length;
        const texture = new Texture(textureID, textureName, filePath);

        if(grid) {
            texture.initGrid(grid, gridWidth, gridHeight);
        } else if(autoGrid) {
            const { startX = 0, startY = 0, rows = 0, columns = 0, first = 1 } = autoGrid;

            texture.autoGrid(startX, startY, rows, columns, first, gridWidth, gridHeight);
        } else if(regions) {
            texture.initRegions(regions);
        }

        this.textures.push(texture);

        textureMap[textureName] = textureID;
    }

    return textureMap;
}

TextureRegistry.prototype.getTextureWithFallback = function(index) {
    if(index < 0 || index >= this.textures.length) {
        return TextureRegistry.EMPTY_TEXTURE;
    }

    return this.textures[index];
}

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