export const TileOverlay = function(maxTiles = 0) {
    this.elements = new Uint16Array(maxTiles * 3);
    this.maxTiles = maxTiles;
    this.count = 0;
    this.alpha = 1;
}

TileOverlay.prototype.add = function(id, x, y) {
    if(this.count >= this.maxTiles) {
        console.error(`TileOverlay is full! [count:${this.count}, maxTiles:${this.maxTiles}]`);
        return;
    }

    if(id < 0 || id > 0xffff || x < 0 || x > 0xffff || y < 0 || y > 0xffff) {
        console.error(`Tile data is invalid! [id:${id}, x:${x}, y:${y}]`);
        return;
    }

    const index = this.count * 3;

    this.elements[index] = id;
    this.elements[index + 1] = x;
    this.elements[index + 2] = y;
    this.count++;
}

TileOverlay.prototype.clear = function() {
    this.count = 0;
}