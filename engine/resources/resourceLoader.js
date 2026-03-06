import { TextureRegistry } from "./textureRegistry.js";
import { TextureHandle } from "./texture/textureHandle.js";

export const ResourceLoader = function() {
    this.textureRegistry = new TextureRegistry();
    this.toResolve = new Map();
    this.tasks = [];
}

ResourceLoader.prototype.clearTexture = function(index) {
    const texture = this.textureRegistry.getTexture(index);

    if(texture) {
        texture.clear();
    }
}

ResourceLoader.prototype.getTotalKBUsed = function() {
    return this.textureRegistry.getSizeBytes() / 1024;
}

ResourceLoader.prototype.createTextures = function(textures) {
    return this.textureRegistry.createTextures(textures);
}

ResourceLoader.prototype.getTexture = function(index) {
    return this.textureRegistry.getTexture(index);
}

ResourceLoader.prototype.update = function() {
    if(this.tasks.length !== 0) {
        const { textureID, handleID, colorMap, type } = this.tasks[0];
        const texture = this.getTexture(textureID);

        if(texture.handle.state !== TextureHandle.STATE.LOADED) {
            return;
        }

        const handle = texture.getHandle(handleID);

        switch(handle.state) {
            case TextureHandle.STATE.EMPTY: {
                texture.loadHandle(handleID, colorMap, type);
                break;
            }
            case TextureHandle.STATE.LOADED: {
                this.tasks[0] = this.tasks[this.tasks.length - 1];
                this.tasks.pop();
                break;
            }
        }
    }
}

ResourceLoader.prototype.addRecolorTask = function(textureID, handleID, colorMap, taskType) {
    //Allow only one task per texture variant.
    for(let i = 0; i < this.tasks.length; i++) {
        const task = this.tasks[i];

        if(task.textureID === textureID && task.handleID === handleID) {
            return;
        }
    }

    this.tasks.push({
        "textureID": textureID,
        "handleID": handleID,
        "colorMap": colorMap,
        "type": taskType
    });
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
    const texture = this.getTexture(id);

    if(texture && texture.handle.state === TextureHandle.STATE.EMPTY) {
        texture.requestBitmap()
        .then((bitmap) => this.resolveLoad(id, bitmap))
        .catch((error) => this.resolveError(id));
    } 
}