import { createImageData, recolorRect, TextureTask } from "./textureTask.js";

export const RecolorRegionTask = function(texture, handle) {
    TextureTask.call(this, texture, handle);

    this.colorID = null;
    this.colorMap = null;
}

RecolorRegionTask.prototype = Object.create(TextureTask.prototype);
RecolorRegionTask.prototype.constructor = RecolorRegionTask;

RecolorRegionTask.prototype.execute = function() {        
    const imageData = createImageData(this.texture.handle.bitmap);
    const { data, width } = imageData;

    for(let i = 0; i < this.texture.regions.length; i++) {
        const { x, y, w, h } = this.texture.regions[i];

        recolorRect(data, width, this.colorMap, x, y, w, h);
    }

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