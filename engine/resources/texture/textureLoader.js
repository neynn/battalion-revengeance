import { TextureRegistry } from "./textureRegistry.js";
import { TextureHandle } from "./textureHandle.js";
import { RecolorRegionTask } from "../textureTask/recolorRegionTask.js";
import { ShadeTask } from "../textureTask/shadeTask.js";
import { TextureTask } from "../textureTask/textureTask.js";

export const TextureLoader = function() {
    this.textureRegistry = new TextureRegistry();
    this.toResolve = new Map();
    this.tasks = [];
}

TextureLoader.TASK_TYPE = {
    FULL: 0,
    REGIONAL: 1,
    SHADE: 2
};

TextureLoader.prototype.clearTexture = function(index) {
    const texture = this.textureRegistry.getTexture(index);

    if(texture) {
        texture.clear();
    }
}

TextureLoader.prototype.getTotalKBUsed = function() {
    return this.textureRegistry.getSizeBytes() / 1024;
}

TextureLoader.prototype.createTextures = function(textures) {
    return this.textureRegistry.createTextures(textures);
}

TextureLoader.prototype.getTexture = function(index) {
    return this.textureRegistry.getTexture(index);
}

TextureLoader.prototype.update = function() {
    //TODO(neyn): Create a proper task counter!
    for(let i = 0; i < 3; i++) {
        if(this.tasks.length !== 0) {
            const task = this.tasks[0];

            switch(task.state) {
                case TextureTask.STATE.RUNNING: {
                    task.run();

                    if(task.handle.state === TextureHandle.STATE.LOADED) {
                        this.tasks[0] = this.tasks[this.tasks.length - 1];
                        this.tasks.pop();
                    }

                    break;
                }
                case TextureTask.STATE.FINISHED: {
                    this.tasks[0] = this.tasks[this.tasks.length - 1];
                    this.tasks.pop();
                    break;
                }
            }
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