import { TextureRegistry } from "./textureRegistry.js";
import { TextureHandle } from "./textureHandle.js";
import { RecolorRegionTask } from "../textureTask/recolorRegionTask.js";
import { ShadeTask } from "../textureTask/shadeTask.js";

export const TextureLoader = function() {
    this.textureRegistry = new TextureRegistry();
    this.toResolve = new Map();
    this.tasks = [];
    this.totalTasks = 0;
}

TextureLoader.prototype.exit = function() {
    this.tasks.length = 0;
    this.totalTasks = 0;
}

TextureHandle.prototype.isDone = function() {
    return this.tasks.length === 0;
}

TextureLoader.prototype.getCompletedTasks = function() {
    return this.totalTasks - this.tasks.length;
}

TextureLoader.prototype.getTotalKBUsed = function() {
    return this.textureRegistry.getSizeBytes() / 1024;
}

TextureLoader.prototype.getTileID = function(name) {
    return this.textureRegistry.getTextureID(TextureRegistry.REGISTRY_TYPE.TILE, name);
}

TextureLoader.prototype.getSpriteID = function(name) {
    return this.textureRegistry.getTextureID(TextureRegistry.REGISTRY_TYPE.SPRITE, name);
}

TextureLoader.prototype.getGUIID = function(name) {
    return this.textureRegistry.getTextureID(TextureRegistry.REGISTRY_TYPE.GUI, name);
}

TextureLoader.prototype.createTileTextures = function(textures) {
    this.textureRegistry.createTextures(TextureRegistry.REGISTRY_TYPE.TILE, textures);
}

TextureLoader.prototype.createSpriteTextures = function(textures) {
    this.textureRegistry.createTextures(TextureRegistry.REGISTRY_TYPE.SPRITE, textures);
}

TextureLoader.prototype.createGUITextures = function(textures) {
    this.textureRegistry.createTextures(TextureRegistry.REGISTRY_TYPE.GUI, textures);
}

TextureLoader.prototype.getTextureWithFallback = function(index) {
    return this.textureRegistry.getTextureWithFallback(index);
}

TextureLoader.prototype.getTexture = function(index) {
    return this.textureRegistry.getTexture(index);
}

TextureLoader.prototype.update = function() {
    //TODO(neyn): Create a proper task counter!
    for(let i = 0; i < 3 && this.tasks.length !== 0; i++) {
        const task = this.tasks[0];

        task.run();

        if(task.isFinished()) {
            this.tasks[0] = this.tasks[this.tasks.length - 1];
            this.tasks.pop();
        }
    }
}

TextureLoader.prototype.addShadeTask = function(textureID, rect, handle) {
    const texture = this.getTexture(textureID);

    if(!texture) {
        return;
    }

    if(texture.handle.state === TextureHandle.STATE.EMPTY) {
        this.loadTexture(textureID);
    }

    const task = new ShadeTask(texture, handle);

    task.rect = rect;

    this.tasks.push(task);
    this.totalTasks++;
}

TextureLoader.prototype.addRecolorTask = function(textureID, colorID, colorMap) {
    //TODO(neyn): Not needed!
    for(let i = 0; i < this.tasks.length; i++) {
        const task = this.tasks[i];

        if(task.textureID === textureID && task.colorID === colorID) {
            return;
        }
    }

    const texture = this.getTexture(textureID);

    if(!texture) {
        return;
    }

    const handle = texture.createHandle(colorID);

    if(handle.state === TextureHandle.STATE.EMPTY) {
        if(texture.handle.state === TextureHandle.STATE.EMPTY) {
            this.loadTexture(textureID);
        }

        const task = new RecolorRegionTask(texture, handle);

        task.colorID = colorID;
        task.colorMap = colorMap;

        this.tasks.push(task);
        this.totalTasks++;
    }
}

TextureLoader.prototype.addLoadResolver = function(textureID, onLoad) {
    const toResolve = this.toResolve.get(textureID);

    if(toResolve) {
        toResolve.push(onLoad);
    } else {
        this.toResolve.set(textureID, [onLoad]);
    }
}

TextureLoader.prototype.resolveLoad = function(textureID, bitmap) {
    const toResolve = this.toResolve.get(textureID);

    if(toResolve) {
        toResolve.forEach(onLoad => onLoad(bitmap));
        
        this.toResolve.delete(textureID);
    }
}

TextureLoader.prototype.resolveError = function(textureID) {
    const toResolve = this.toResolve.get(textureID);

    if(toResolve) {
        this.toResolve.delete(textureID);
    }  
}

TextureLoader.prototype.loadTexture = function(id) {
    const texture = this.getTexture(id);

    if(texture && texture.handle.state === TextureHandle.STATE.EMPTY) {
        texture.requestBitmap()
        .then((bitmap) => this.resolveLoad(id, bitmap))
        .catch((error) => this.resolveError(id));
    } 
}