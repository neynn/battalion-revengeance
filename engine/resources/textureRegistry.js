import { AtlasTexture } from "./atlasTexture.js";
import { PathHandler } from "./pathHandler.js";
import { Texture } from "./texture.js";

export const TextureRegistry = function() {
    this.nextID = 0;
    this.textures = [];
    this.copyTextures = new Map();
}

TextureRegistry.EMPTY_ID = -1;
TextureRegistry.DEFAULT_TEXTURE_TYPE = ".png";
TextureRegistry.EMPTY_ATLAS_TEXTURE = new AtlasTexture(TextureRegistry.EMPTY_ID, "", {});
TextureRegistry.EMPTY_TEXTURE = new Texture(TextureRegistry.EMPTY_ID, "");

TextureRegistry.prototype.getSizeBytes = function() {
    let bytes = 0;

    for(let i = 0; i < this.textures.length; i++) {
        bytes += this.textures[i].getSizeBytes();
    }

    this.copyTextures.forEach(texture => bytes += texture.getSizeBytes());

    return bytes;
}

TextureRegistry.prototype.getCopyTexture = function(textureName) {
    const texture = this.copyTextures.get(textureName);

    if(!texture) {
        return null;
    }

    return texture;
}

TextureRegistry.prototype.destroyCopyTexture = function(textureName) {
    const texture = this.copyTextures.get(textureName);

    if(texture) {
        texture.clear();

        this.copyTextures.delete(textureName);
    }
}

TextureRegistry.prototype.destroyCopyTextures = function() {
    this.copyTextures.forEach(texture => texture.clear());
    this.copyTextures.clear();
}

TextureRegistry.prototype.createCopyAtlasTexture = function(textureName, atlasTexture) {
    const copyTexture = this.copyTextures.get(textureName);

    if(copyTexture) {
        return copyTexture;
    }

    const { regions } = atlasTexture;
    const newTexture = new AtlasTexture(TextureRegistry.EMPTY_ID, textureName, regions);

    this.copyTextures.set(textureName, newTexture);

    return newTexture;
}

TextureRegistry.prototype.createCopyTexture = function(textureName) {
    const copyTexture = this.copyTextures.get(textureName);

    if(copyTexture) {
        return copyTexture;
    }

    const newTexture = new Texture(TextureRegistry.EMPTY_ID, textureName);

    this.copyTextures.set(textureName, newTexture);

    return newTexture;
}

TextureRegistry.prototype.createTextures = function(textures) {
    const textureMap = {};

    for(const textureName in textures) {
        const { directory, source } = textures[textureName];
        const fileName = source ? source : `${textureName}${TextureRegistry.DEFAULT_TEXTURE_TYPE}`;
        const filePath = PathHandler.getPath(directory, fileName);
        const textureID = this.nextID++;
        const texture = new Texture(textureID, filePath);

        this.textures.push(texture);

        textureMap[textureName] = textureID;
    }

    return textureMap;
}

TextureRegistry.prototype.createAtlasTextures = function(textures) {
    const textureMap = {};

    for(const textureName in textures) {
        const { directory, source, autoRegions, regions = {} } = textures[textureName];
        const fileName = source ? source : `${textureName}${TextureRegistry.DEFAULT_TEXTURE_TYPE}`;
        const filePath = PathHandler.getPath(directory, fileName);
        const textureID = this.nextID++;
        const texture = new AtlasTexture(textureID, filePath, regions);

        if(autoRegions) {
            const { startX, startY, frameWidth, frameHeight, rows, columns } = autoRegions;

            texture.autoCalcRegions(startX, startY, frameWidth, frameHeight, rows, columns);
        }

        this.textures.push(texture);

        textureMap[textureName] = textureID;
    }

    return textureMap;
}

TextureRegistry.prototype.getTextureByID = function(id) {
    if(id !== TextureRegistry.EMPTY_ID) {
        for(let i = 0; i < this.textures.length; i++) {
            if(this.textures[i].id === id) {
                return this.textures[i];
            }
        }
    }

    return null;
}

TextureRegistry.prototype.destroyTexture = function(id) {
    if(id !== TextureRegistry.EMPTY_ID) {
        for(let i = 0; i < this.textures.length; i++) {
            if(this.textures[i].id === id) {
                this.textures[i] = this.textures[this.textures.length -1];
                this.textures.pop();
                break;
            }
        }
    }
}   

TextureRegistry.prototype.clear = function() {
    for(let i = 0; i < this.textures.length; i++) {
        this.textures[i].clear();
    }

    this.destroyCopyTextures();
}