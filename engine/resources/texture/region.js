export const TextureRegion = function(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
}

TextureRegion.prototype.copy = function(region) {
    this.x = region.x;
    this.y = region.y;
    this.w = region.w;
    this.h = region.h;
}