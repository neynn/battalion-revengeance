import { TextureHandle } from "../texture/textureHandle.js";
import { createImageData, recolorImageWithRegions, TextureTask } from "./textureTask.js";

export const RecolorRegionTask = function(texture, handle) {
    TextureTask.call(this, texture, handle);

    this.colorID = null;
    this.colorMap = null;
}

RecolorRegionTask.prototype = Object.create(TextureTask.prototype);
RecolorRegionTask.prototype.constructor = RecolorRegionTask;

RecolorRegionTask.prototype.run = function() {
    if(this.texture.handle.state === TextureHandle.STATE.LOADED) {
        if(this.handle.state === TextureHandle.STATE.EMPTY) {
            this.handle.state = TextureHandle.STATE.LOADING;
                
            const imageData = createImageData(this.texture.handle.bitmap);

            recolorImageWithRegions(imageData, this.colorMap, this.texture.regions);

            createImageBitmap(imageData)
            .then(bitmap => {
                this.handle.setImage(bitmap);
                this.state = TextureTask.STATE.FINISHED;
            })
            .catch(error => {
                this.handle.clear();
                this.state = TextureTask.STATE.FINISHED;
            });
        }
    }
}