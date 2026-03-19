import { createImageData, recolorRect, TextureTask } from "./textureTask.js";

export const RecolorWholeTask = function(texture, handle) {
    TextureTask.call(this, texture, handle);

    this.colorID = null;
    this.colorMap = null;
}

RecolorWholeTask.prototype = Object.create(TextureTask.prototype);
RecolorWholeTask.prototype.constructor = RecolorWholeTask;

RecolorWholeTask.prototype.execute = function() {
    const imageData = createImageData(this.texture.handle.bitmap);
    const { data, width, height } = imageData;

    recolorRect(data, width, this.colorMap, 0, 0, width, height);

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