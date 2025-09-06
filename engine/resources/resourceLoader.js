import { EventEmitter } from "../events/eventEmitter.js";
import { PathHandler } from "./pathHandler.js";
import { Texture } from "./texture.js";

export const ResourceLoader = function() {
    this.nextID = 0;
    this.textures = [];
    this.audio = [];
    this.colorCopyTextures = {};

    this.events = new EventEmitter();
    this.events.listen(ResourceLoader.EVENT.TEXTURE_LOADED);
    this.events.listen(ResourceLoader.EVENT.TEXTURE_ERROR);

    this.events.on(ResourceLoader.EVENT.TEXTURE_ERROR, (t, e) => console.log(t, e));
    this.events.on(ResourceLoader.EVENT.TEXTURE_LOADED, (t, r) => console.log(t, r));
}

ResourceLoader.EVENT = {
    TEXTURE_LOADED: "TEXTURE_LOADED",
    TEXTURE_ERROR: "TEXTURE_ERROR"
};

ResourceLoader.EMPTY_TEXTURE = new Texture(-1, "", {})
ResourceLoader.DEFAULT = {
    TEXTURE_TYPE: ".png",
    AUDIO_TYPE: ".mp3"
};

ResourceLoader.prototype.freeColorCopiedTextures = function() {
    for(const textureName in this.colorCopyTextures) {
        for(let i = 0; i < this.textures.length; i++) {
            if(this.textures[i].id === this.colorCopyTextures[textureName]) {
                this.textures[i].clear();
                this.textures[i] = this.textures[this.textures.length - 1];
                this.textures.pop();
                break;
            }
        }
    }
}

ResourceLoader.prototype.createCopyTexture = function(textureName, texture) {
    if(this.colorCopyTextures[textureName] !== undefined) {
        return this.getTextureByID(this.colorCopyTextures[textureName]);
    }

    const { regions } = texture;
    const textureID = this.nextID++;
    const newTexture = new Texture(textureID, textureName, regions);

    newTexture.isCopy = true;

    this.textures.push(newTexture);
    this.colorCopyTextures[textureName] = textureID;

    return newTexture;
}

ResourceLoader.prototype.createTextures = function(textures) {
    const textureMap = {};

    for(const textureName in textures) {
        const { directory, source, autoRegions, regions = {} } = textures[textureName];
        const fileName = source ? source : `${textureName}${ResourceLoader.DEFAULT.TEXTURE_TYPE}`;
        const filePath = PathHandler.getPath(directory, fileName);
        const textureID = this.nextID++;
        const texture = new Texture(textureID, filePath, regions);

        if(autoRegions) {
            const { startX, startY, frameWidth, frameHeight, rows, columns } = autoRegions;

            texture.autoCalcRegions(startX, startY, frameWidth, frameHeight, rows, columns);
        }

        this.textures.push(texture);

        textureMap[textureName] = textureID;
    }

    return textureMap;
}

ResourceLoader.prototype.getTextureByID = function(id) {
    for(let i = 0; i < this.textures.length; i++) {
        if(this.textures[i].id === id) {
            return this.textures[i];
        }
    }

    return null;
}

ResourceLoader.prototype.getAudioByID = function(id) {
    for(let i = 0; i < this.audio.length; i++) {
        if(this.audio[i].id === id) {
            return this.audio[i];
        }
    }

    return null;
}

ResourceLoader.prototype.createAudio = function() {

}

ResourceLoader.prototype.destroyTexture = function(id) {
    for(let i = 0; i < this.textures.length; i++) {
        if(this.textures[i].id === id) {
            this.textures[i] = this.textures[this.textures.length -1];
            this.textures.pop();
            break;
        }
    }
}   

ResourceLoader.prototype.loadTexture = function(id) {
    const texture = this.getTextureByID(id);

    if(texture && texture.state === Texture.STATE.EMPTY && !texture.isCopy) {
        texture.requestBitmap()
        .then((result) => this.events.emit(ResourceLoader.EVENT.TEXTURE_LOADED, texture, result))
        .catch((error) => this.events.emit(ResourceLoader.EVENT.TEXTURE_ERROR, texture, error));
    } 
}

ResourceLoader.prototype.streamAudio = function() {}
ResourceLoader.prototype.loadAudio = function() {}