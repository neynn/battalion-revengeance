import { createImageData, recolorRect, TextureTask } from "./textureTask.js";

export const RecolorRegionTask = function(source, target, regions) {
    TextureTask.call(this, source, target);

    this.colorID = null;
    this.colorMap = null;
    this.regions = regions;
}

RecolorRegionTask.prototype = Object.create(TextureTask.prototype);
RecolorRegionTask.prototype.constructor = RecolorRegionTask;

RecolorRegionTask.prototype.execute = function() {        
    const imageData = createImageData(this.source.bitmap);
    const { data, width } = imageData;

    for(let i = 0; i < this.regions.length; i++) {
        const { x, y, w, h } = this.regions[i];

        recolorRect(data, width, this.colorMap, x, y, w, h);
    }

    createImageBitmap(imageData)
    .then(bitmap => {
        this.target.setImage(bitmap);
        this.state = TextureTask.STATE.FINISHED;
    })
    .catch(error => {
        this.target.clear();
        this.state = TextureTask.STATE.FINISHED;
    });
}