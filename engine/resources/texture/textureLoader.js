import { TextureRegistry } from "./textureRegistry.js";
import { ImageResource } from "./imageResource.js";
import { RecolorRegionTask } from "../textureTask/recolorRegionTask.js";
import { ShadeTask } from "../textureTask/shadeTask.js";
import { TextureTask } from "../textureTask/textureTask.js";

/**
 * 
 * @param {TextureRegistry} textureRegistry 
 */
export const TextureLoader = function(textureRegistry) {
    this.textureRegistry = textureRegistry;
    this.tasks = [];
    this.totalTasks = 0;
}

TextureLoader.prototype.exit = function() {
    this.tasks.length = 0;
    this.totalTasks = 0;
}

TextureLoader.prototype.isDone = function() {
    return this.tasks.length === 0;
}

TextureLoader.prototype.getCompletedTasks = function() {
    return this.totalTasks - this.tasks.length;
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

TextureLoader.prototype.addShadeTask = function(textureID, rect, target) {
    const texture = this.textureRegistry.getTexture(textureID);

    if(!texture) {
        return;
    }

    const source = texture.getImage();

    if(source.state === ImageResource.STATE.EMPTY) {
        this.textureRegistry.loadTexture(textureID);
    }

    this.tasks.push(new ShadeTask(source, target, rect));
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

    const texture = this.textureRegistry.getTexture(textureID);

    if(!texture) {
        return;
    }

    const source = texture.getImage();
    const target = texture.getOrCreateImageVariant(colorID);

    if(target.state === ImageResource.STATE.EMPTY) {
        if(source.state === ImageResource.STATE.EMPTY) {
            this.textureRegistry.loadTexture(textureID);
        }

        const task = new RecolorRegionTask(source, target, texture.regions);

        task.colorID = colorID;
        task.colorMap = colorMap;

        this.tasks.push(task);
        this.totalTasks++;
    }
}