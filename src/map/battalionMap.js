import { WorldMap } from "../../engine/map/worldMap.js";

export const BattalionMap = function(id) {
    WorldMap.call(this, id);
}

BattalionMap.LAYER = {
    GROUND: "ground",
    DECORATION: "decoration",
    CLOUD: "cloud",
    FLAG: "flag",
    TEAM: "team"
};

BattalionMap.prototype = Object.create(WorldMap.prototype);
BattalionMap.prototype.constructor = BattalionMap;

BattalionMap.prototype.saveFlags = function() {
    return [];
}

BattalionMap.prototype.checkTileFlag = function(tileX, tileY, flag) {
    const tileFlags = this.getTile(BattalionMap.LAYER.FLAG, tileX, tileY);

    if(tileFlags === -1) {
        return false;
    }

    return (tileFlags & flag) !== 0;
}

BattalionMap.prototype.setTileFlag = function(tileX, tileY, flag) {
    const tileFlags = this.getTile(BattalionMap.LAYER.FLAG, tileX, tileY);

    if(tileFlags !== -1) {
        this.placeTile(tileFlags | flag, BattalionMap.LAYER.FLAG, tileX, tileY);
    }
}

BattalionMap.prototype.removeTileFlag = function(tileX, tileY, flag) {
    const tileFlags = this.getTile(BattalionMap.LAYER.FLAG, tileX, tileY);

    if(tileFlags !== -1) {
        this.placeTile(tileFlags & ~flag, BattalionMap.LAYER.FLAG, tileX, tileY);
    }
}