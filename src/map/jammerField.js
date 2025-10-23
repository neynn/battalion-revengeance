import { TypeRegistry } from "../type/typeRegistry.js";

export const JammerField = function(tileX, tileY) {
    this.tileX = tileX;
    this.tileY = tileY;
    this.blockers = 0;
}

JammerField.prototype.removeBlocker = function() {
    this.blockers--;

    if(this.blockers === 0) {
        this.blockers = 0;
    }
}

JammerField.prototype.addBlocker = function() {
    this.blockers++;
}

JammerField.prototype.isJammed = function(movementType) {
    return movementType === TypeRegistry.MOVEMENT_TYPE.FLIGHT && this.blockers > 0;
}