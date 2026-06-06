export const TextureRegion = function(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.offsetX = 0;
    this.offsetY = 0;
}

TextureRegion.prototype.copy = function(region) {
    this.x = region.x;
    this.y = region.y;
    this.w = region.w;
    this.h = region.h;
    this.offsetX = region.offsetX;
    this.offsetY = region.offsetY;
}