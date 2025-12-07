import { TileManager } from "../../tile/tileManager.js";

export const BrushSet = function(name, values) {
    this.name = name;
    this.values = values;
}

BrushSet.prototype.getTileID = function(index) {
    if(index < 0 || index >= this.values.length) {
        return TileManager.TILE_ID.INVALID;
    }

    return this.values[index];
}

BrushSet.prototype.getSize = function() {
    return this.values.length;
}