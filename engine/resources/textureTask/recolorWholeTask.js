import { createImageData, recolorRect, TextureTask } from "./textureTask.js";

export const RecolorWholeTask = function(source, target) {
    TextureTask.call(this, source, target);

    this.colorID = null;
    this.colorMap = null;
}

RecolorWholeTask.prototype = Object.create(TextureTask.prototype);
RecolorWholeTask.prototype.constructor = RecolorWholeTask;

RecolorWholeTask.prototype.execute = function() {
    const imageData = createImageData(this.source.bitmap);
    const { data, width, height } = imageData;

    recolorRect(data, width, this.colorMap, 0, 0, width, height);

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