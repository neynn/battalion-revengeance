export const EntityFlagMap = function(startX, startY, range) {
    this.startX = startX;
    this.startY = startY;
    this.range = range;
    this.size = 2 * range + 1;
    this.buffer = new Uint8Array(this.size * this.size);
    this.center = range * this.size + range;
    this.buffer[this.center] = EntityFlagMap.FLAG.SELF;
}

EntityFlagMap.FLAG = {
    SELF: 1 << 0,
    OUT_OF_BOUNDS: 1 << 1,
    ENTITY_BLOCK: 1 << 2,
    ENTITY_PASS: 1 << 3
};

EntityFlagMap.prototype.getFlag = function(tileX, tileY) {
    const deltaX = tileX - this.startX;
    const deltaY = tileY - this.startY;
    const flagX = this.range + deltaX;
    const flagY = this.range + deltaY;

    if(flagX < 0 || flagY < 0 || flagX >= this.size || flagY >= this.size) {
        return -1;
    }

    const index = flagY * this.size + flagX;

    return this.buffer[index];
}

EntityFlagMap.prototype.getCenter = function() {
    return this.buffer[this.center];
}