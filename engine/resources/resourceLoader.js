import { EventEmitter } from "../events/eventEmitter.js";
import { TextureRegistry } from "./textureRegistry.js";
import { Texture } from "./texture.js";

export const ResourceLoader = function() {
    this.textureRegistry = new TextureRegistry();
    this.toResolve = new Map();

    this.events = new EventEmitter();
    this.events.register(ResourceLoader.EVENT.TEXTURE_LOADED);
    this.events.register(ResourceLoader.EVENT.TEXTURE_ERROR);

    this.events.on(ResourceLoader.EVENT.TEXTURE_ERROR, (t, e) => console.error("ERROR", t, e));
    this.events.on(ResourceLoader.EVENT.TEXTURE_LOADED, (t, r) => console.log("LOADED", t, r));
}

ResourceLoader.EVENT = {
    TEXTURE_LOADED: "TEXTURE_LOADED",
    TEXTURE_ERROR: "TEXTURE_ERROR"
};

ResourceLoader.prototype.getTotalKBUsed = function() {
    console.log(this.textureRegistry.getSizeBytes() / 1024);
}

ResourceLoader.prototype.getCopyTexture = function(textureName) {
    return this.textureRegistry.getCopyTexture(textureName);
}

ResourceLoader.prototype.destroyCopyTexture = function(textureName) {
    this.textureRegistry.destroyCopyTexture(textureName);
}

ResourceLoader.prototype.destroyCopyTextures = function() {
    this.textureRegistry.destroyCopyTextures();
}

ResourceLoader.prototype.createCopyTexture = function(textureName, texture) {
    return this.textureRegistry.createCopyAtlasTexture(textureName, texture);
}

ResourceLoader.prototype.createTextures = function(textures) {
    return this.textureRegistry.createAtlasTextures(textures);
}

ResourceLoader.prototype.getTextureByID = function(id) {
    return this.textureRegistry.getTextureByID(id);
}

ResourceLoader.prototype.destroyTexture = function(id) {
    this.textureRegistry.destroyTexture(id);
}   

ResourceLoader.prototype.addLoadResolver = function(textureID, onLoad) {
    const toResolve = this.toResolve.get(textureID);

    if(toResolve) {
        toResolve.push(onLoad);
    } else {
        this.toResolve.set(textureID, [onLoad]);
    }
}

ResourceLoader.prototype.resolveLoad = function(textureID, bitmap) {
    const toResolve = this.toResolve.get(textureID);

    if(toResolve) {
        toResolve.forEach(onLoad => onLoad(bitmap));
        
        this.toResolve.delete(textureID);
    }
}

ResourceLoader.prototype.resolveError = function(textureID) {
    const toResolve = this.toResolve.get(textureID);

    if(toResolve) {
        this.toResolve.delete(textureID);
    }  
}

ResourceLoader.prototype.loadTexture = function(id) {
    const texture = this.getTextureByID(id);

    if(texture && texture.state === Texture.STATE.EMPTY) {
        texture.requestBitmap()
        .then((bitmap) => {
            this.resolveLoad(id, bitmap);
            this.events.emit(ResourceLoader.EVENT.TEXTURE_LOADED, texture, bitmap);
        })
        .catch((error) => {
            this.resolveError(id);
            this.events.emit(ResourceLoader.EVENT.TEXTURE_ERROR, texture, error);
        });
    } 
}