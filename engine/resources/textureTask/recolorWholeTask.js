import { TextureHandle } from "../texture/textureHandle.js";
import { createImageData, recolorImage, TextureTask } from "./textureTask.js";

export const RecolorWholeTask = function(texture, handle) {
    TextureTask.call(this, texture, handle);

    this.colorID = null;
    this.colorMap = null;
}

RecolorWholeTask.prototype = Object.create(TextureTask.prototype);
RecolorWholeTask.prototype.constructor = RecolorWholeTask;

RecolorWholeTask.prototype.run = function() {
    if(this.texture.handle.state === TextureHandle.STATE.LOADED) {
        if(this.handle.state === TextureHandle.STATE.EMPTY) {
            this.handle.state = TextureHandle.STATE.LOADING;
                
            const imageData = createImageData(this.texture.handle.bitmap);

            recolorImage(imageData, this.colorMap, this.texture.regions);

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