import { createEmptyImageData, TextureTask } from "./textureTask.js";

export const ShadeTask = function(source, target, rect) {
    TextureTask.call(this, source, target);

    this.rect = rect;
}

ShadeTask.prototype = Object.create(TextureTask.prototype);
ShadeTask.prototype.constructor = ShadeTask;

ShadeTask.prototype.execute = function() {
    const { x, y, w, h } = this.rect; 
    const imageData = createEmptyImageData(w, h, this.source.bitmap, x, y);
    const buffer = imageData.data;

    for(let i = 0; i < h; i++) {
        for(let j = 0; j < w; j++) {
            const index = (i * w + j) * 4;
            const r = buffer[index];
            const g = buffer[index + 1];
            const b = buffer[index + 2];
            const color = (r << 16) | (g << 8) | b;

            if(color !== 0) {
                buffer[index] = 0;
                buffer[index + 1] = 0;
                buffer[index + 2] = 0;
                buffer[index + 3] = 127;
            }
        }
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