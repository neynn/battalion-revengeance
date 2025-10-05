export const EntityFlagMap = function(range) {
    this.range = range;
    this.size = 2 * range + 1;
    this.buffer = new Uint8Array(this.size * this.size);
    this.center = range * this.size + range;
    this.buffer[this.center] = EntityFlagMap.FLAG.SELF;
}

EntityFlagMap.FLAG = {
    SELF: 1 << 0,
    OUT_OF_BOUNDS: 1 << 1
}

EntityFlagMap.prototype.getFlag = function(deltaX, deltaY) {
    const flagX = this.range + deltaX;
    const flagY = this.range + deltaY;
    const index = flagY * this.size + flagX;

    if(index < 0 || index >= this.buffer.length) {
        return -1;
    }

    return this.buffer[index];
}
