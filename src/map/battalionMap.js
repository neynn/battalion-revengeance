import { Layer } from "../../engine/map/layer.js";
import { WorldMap } from "../../engine/map/worldMap.js";
import { TypeHelper } from "../type/typeHelper.js";
import { TypeRegistry } from "../type/typeRegistry.js";

export const BattalionMap = function(id) {
    WorldMap.call(this, id);

    this.createLayer(BattalionMap.LAYER.FLAG, Layer.TYPE.BIT_8);
    this.createLayer(BattalionMap.LAYER.TEAM, Layer.TYPE.BIT_8);
    this.climate = TypeRegistry.CLIMATE_TYPE.NONE;
    this.music = null;
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

BattalionMap.prototype.setClimate = function(climateType) {
    this.climate = climateType;
}

BattalionMap.prototype.getClimateType = function(gameContext, tileX, tileY) {
    if(this.climate !== TypeRegistry.CLIMATE_TYPE.NONE) {
        return this.climate;
    }

    if(this.isTileOutOfBounds(tileX, tileY)) {
        return TypeRegistry.CLIMATE_TYPE.TEMPERATE;
    }

    const { tileManager } = gameContext;
    const layers = [BattalionMap.LAYER.DECORATION, BattalionMap.LAYER.GROUND];

    for(const layerID of layers) {
        const typeID = this.getTile(layerID, tileX, tileY);
        const meta = tileManager.getMeta(typeID);

        if(meta) {
            const { type = TypeRegistry.TILE_TYPE.NONE } = meta;
            const climate = TypeHelper.getClimateType(gameContext, type);

            if(climate !== TypeRegistry.CLIMATE_TYPE.NONE) {
                return climate;
            }
        }
    }

    return TypeRegistry.CLIMATE_TYPE.TEMPERATE;
}

BattalionMap.prototype.getTerrainTags = function(gameContext, tileX, tileY) {
    const tags = new Set();

    if(this.isTileOutOfBounds(tileX, tileY)) {
        return tags;
    }

    const { tileManager } = gameContext;
    const layers = [BattalionMap.LAYER.GROUND, BattalionMap.LAYER.DECORATION];

    for(const layerID of layers) {
        const typeID = this.getTile(layerID, tileX, tileY);
        const meta = tileManager.getMeta(typeID);

        if(meta) {
            const { type = TypeRegistry.TILE_TYPE.NONE } = meta;
            const terrainTags = TypeHelper.getTerrainTags(gameContext, type);

            for(let i = 0; i < terrainTags.length; i++) {
                tags.add(terrainTags[i]);
            }
        }
    }

    return tags;
}