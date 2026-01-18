import { Layer } from "../../engine/map/layer.js";
import { WorldMap } from "../../engine/map/worldMap.js";
import { CLIMATE_TYPE, TILE_ID, TILE_TYPE } from "../enums.js";
import { TileType } from "../type/parsed/tileType.js";
import { JammerField } from "./jammerField.js";

export const BattalionMap = function(id, width, height) {
    WorldMap.call(this, id, width, height);

    this.globalClimate = CLIMATE_TYPE.NONE;
    this.climate = CLIMATE_TYPE.NONE;
    this.localization = [];
    this.buildings = [];
    this.edits = [];
    this.jammerFields = new Map();
    this.createLayer(Layer.TYPE.BIT_16);
    this.createLayer(Layer.TYPE.BIT_16);
    this.createLayer(Layer.TYPE.BIT_16);
    this.createLayer(Layer.TYPE.BIT_8);
    this.createLayer(Layer.TYPE.BIT_8);
}

BattalionMap.LAYER_NAME = {
    GROUND: "GROUND",
    DECORATION: "DECORATION",
    CLOUD: "CLOUD",
    FLAG: "FLAG",
    TEAM: "TEAM"
};

BattalionMap.LAYER = {
    GROUND: 0,
    DECORATION: 1,
    CLOUD: 2,
    FLAG: 3,
    TEAM: 4
};

BattalionMap.SEARCH_ORDER = [
    BattalionMap.LAYER.CLOUD,
    BattalionMap.LAYER.DECORATION,
    BattalionMap.LAYER.GROUND
];

BattalionMap.STUB_JAMMER = new JammerField(-1, -1);

BattalionMap.getLayerIndex = function(name) {
    const index = BattalionMap.LAYER[name];

    if(index === undefined) {
        return -1;
    }

    return index;
}

BattalionMap.prototype = Object.create(WorldMap.prototype);
BattalionMap.prototype.constructor = BattalionMap;

BattalionMap.prototype.loadEdits = function(edits) {
    for(const { layer, index, tile } of edits) {
        this.getLayer(layer).setItem(tile, index);
    }

    this.edits = edits;
}

BattalionMap.prototype.editTile = function(layerID, tileX, tileY, tileID) {
    const index = this.getIndex(tileX, tileY);

    if(index !== -1) {
        const layer = this.getLayer(layerID);

        if(layer !== WorldMap.EMPTY_LAYER) {
            layer.setItem(tileID, index);

            this.edits.push({
                "layer": layerID,
                "index": index,
                "tile": tileID
            });
        }
    }
}

BattalionMap.prototype.saveFlags = function() {
    return [];
}

BattalionMap.prototype.setClimate = function(local, global) {
    this.climate = local ?? CLIMATE_TYPE.NONE;
    this.globalClimate = global ?? CLIMATE_TYPE.NONE;
}

BattalionMap.prototype.getLogisticFactor = function(gameContext, tileX, tileY) {
    const { logisticFactor } = this.getClimateType(gameContext, tileX, tileY);

    return logisticFactor;
}

BattalionMap.prototype.getClimateType = function(gameContext, tileX, tileY) {
    const { tileManager, typeRegistry } = gameContext;

    //Maps may have a global climate that overrides all.
    if(this.globalClimate !== CLIMATE_TYPE.NONE) {
        return typeRegistry.getClimateType(this.globalClimate);
    }

    if(!this.isTileOutOfBounds(tileX, tileY)) {
        for(const layerID of BattalionMap.SEARCH_ORDER) {
            const typeID = this.getTile(layerID, tileX, tileY);
            const { type } = tileManager.getTile(typeID);

            //A climate type of NONE means falling through. This allows roads to be climate agnostic.
            if(type !== null) {
                const { climate } = typeRegistry.getTileType(type);

                if(climate !== CLIMATE_TYPE.NONE) {
                    return typeRegistry.getClimateType(climate);
                }
            }
        }
    }

    //Backup local climate if the tile has no climate.
    if(this.climate !== CLIMATE_TYPE.NONE) {
        return typeRegistry.getClimateType(this.climate);
    }

    //Always ensure to return a proper climate type.
    return typeRegistry.getClimateType(CLIMATE_TYPE.TEMPERATE);
}

BattalionMap.prototype.getTerrainTypes = function(gameContext, tileX, tileY) {
    const { tileManager, typeRegistry } = gameContext;
    const types = [];

    if(this.isTileOutOfBounds(tileX, tileY)) {
        return types;
    }

    for(const layerID of BattalionMap.SEARCH_ORDER) {
        const typeID = this.getTile(layerID, tileX, tileY);
        const { type } = tileManager.getTile(typeID);

        if(type !== null && type !== TILE_TYPE.NONE) {
            const { terrain } = typeRegistry.getTileType(type);

            for(let i = 0; i < terrain.length; i++) {
                types.push(typeRegistry.getTerrainType(terrain[i]));
            }

            return types;
        }
    }

    return types;
}

BattalionMap.prototype.getOreValue = function(tileX, tileY) {
    for(const layerID of BattalionMap.SEARCH_ORDER) {
        const typeID = this.getTile(layerID, tileX, tileY);

        switch(typeID) {
            case TILE_ID.ORE_LEFT: return 500;
            case TILE_ID.ORE_RIGHT: return 500;
            case TILE_ID.ORE_LEFT_USED: return 300;
            case TILE_ID.ORE_RIGHT_USED: return 300;
        }
    }

    return 0;
}

BattalionMap.prototype.extractOre = function(tileX, tileY) {
    for(const layerID of BattalionMap.SEARCH_ORDER) {
        const typeID = this.getTile(layerID, tileX, tileY);
        
        switch(typeID) {
            case TILE_ID.ORE_LEFT: {
                this.placeTile(TILE_ID.ORE_LEFT_USED, layerID, tileX, tileY);
                return;
            }
            case TILE_ID.ORE_RIGHT: {
                this.placeTile(TILE_ID.ORE_RIGHT_USED, layerID, tileX, tileY);
                return;
            }
            case TILE_ID.ORE_LEFT_USED: {
                this.placeTile(TILE_ID.ORE_LEFT_DEPLETED, layerID, tileX, tileY);
                return;
            }
            case TILE_ID.ORE_RIGHT_USED: {
                this.placeTile(TILE_ID.ORE_RIGHT_DEPLETED, layerID, tileX, tileY);
                return;
            }
        }
    }
}

BattalionMap.prototype.getTileType = function(gameContext, tileX, tileY) {
    const { tileManager, typeRegistry } = gameContext;

    if(this.isTileOutOfBounds(tileX, tileY)) {
        return typeRegistry.getTileType(TILE_TYPE.NONE);
    }

    for(const layerID of BattalionMap.SEARCH_ORDER) {
        const typeID = this.getTile(layerID, tileX, tileY);
        const { type } = tileManager.getTile(typeID);

        if(type !== null && type !== TILE_TYPE.NONE) {
            return typeRegistry.getTileType(type);
        }
    }

    return typeRegistry.getTileType(TILE_TYPE.NONE);
}

BattalionMap.prototype.getTileName = function(gameContext, tileX, tileY) {
    const { language } = gameContext;

    if(this.isTileOutOfBounds(tileX, tileY)) {
        return language.getSystemTranslation(TileType.MISSING_NAME);
    }

    for(let i = 0; i < this.localization.length; i++) {
        const { x = -1, y = -1, name } = this.localization[i];

        if(x === tileX && y === tileY && name) {
            return language.getMapTranslation(name);
        }
    }

    const { name } = this.getTileType(gameContext, tileX, tileY);

    return language.getSystemTranslation(name);
}

BattalionMap.prototype.getTileDesc = function(gameContext, tileX, tileY) {
    const { language } = gameContext;

    if(this.isTileOutOfBounds(tileX, tileY)) {
        return language.getSystemTranslation(TileType.MISSING_DESC);
    }

    for(let i = 0; i < this.localization.length; i++) {
        const { x = -1, y = -1, desc } = this.localization[i];

        if(x === tileX && y === tileY && desc) {
            return language.getMapTranslation(desc);
        }
    }

    const { desc } = this.getTileType(gameContext, tileX, tileY);

    return language.getSystemTranslation(desc);
}

BattalionMap.prototype.removeLocalization = function(tileX, tileY) {
    for(let i = 0; i < this.localization.length; i++) {
        const { x, y } = this.localization[i];

        if(x === tileX && y === tileY) {
            this.localization[i] = this.localization[this.localization.length - 1];
            this.localization.pop();
            break;
        }
    }
}

BattalionMap.prototype.loadLocalization = function(localization) {
    const indices = new Set();

    for(let i = 0; i < localization.length; i++) {
        const { x = -1, y = -1, name = null, desc = null } = localization[i];
        const index = this.getIndex(x, y);

        if(index !== WorldMap.OUT_OF_BOUNDS) {
            if(!indices.has(index)) {
                this.localization.push({
                    "x": x,
                    "y": y,
                    "name": name,
                    "desc": desc
                });

                indices.add(index);
            } else {
                //Localization already exists for this tile.
            }
        }
    }
}

BattalionMap.prototype.isBuildingPlaceable = function(tileX, tileY) {
    const index = this.getIndex(tileX, tileY);

    if(index === WorldMap.OUT_OF_BOUNDS) {
        return false;
    }

    if(this.getBuilding(tileX, tileY) !== null) {
        return false;
    }

    return true;
}

BattalionMap.prototype.addBuilding = function(building) {
    this.buildings.push(building);
}

BattalionMap.prototype.getBuilding = function(tileX, tileY) {
    const index = this.getIndex(tileX, tileY);

    if(index !== WorldMap.OUT_OF_BOUNDS) {
        for(let i = 0; i < this.buildings.length; i++) {
            const building = this.buildings[i];

            if(building.isPlacedOn(tileX, tileY)) {
                return building;
            }
        }
    }

    return null;
}

BattalionMap.prototype.addJammer = function(tileX, tileY, teamID, flags) {
    const index = this.getIndex(tileX, tileY);

    if(index !== WorldMap.OUT_OF_BOUNDS) {
        const jammerField = this.jammerFields.get(index);

        if(jammerField) {
            jammerField.addBlocker(teamID, flags);
        } else {
            const newField = new JammerField(tileX, tileY);

            newField.addBlocker(teamID, flags);

            this.jammerFields.set(index, newField);
        }
    }
}

BattalionMap.prototype.removeJammer = function(tileX, tileY, teamID, flags) {
    const index = this.getIndex(tileX, tileY);
    const jammerField = this.jammerFields.get(index);

    if(jammerField) {
        jammerField.removeBlocker(teamID, flags);

        if(jammerField.isEmpty()) {
            this.jammerFields.delete(index);
        }
    }
}

BattalionMap.prototype.getJammer = function(tileX, tileY) {
    const index = this.getIndex(tileX, tileY);
    const jammerField = this.jammerFields.get(index);

    if(!jammerField) {
        return BattalionMap.STUB_JAMMER;
    }

    return jammerField;
}

BattalionMap.prototype.decodeLayers = function(layerData) {
    for(const layerID in layerData) {
        const data = layerData[layerID];
        const index = BattalionMap.LAYER[layerID];

        if(index !== undefined) {
            this.getLayer(index).decode(data);
        } else {
            console.error(`Unknown layer! ${layerID}`);
        }
    }
}

BattalionMap.prototype.saveLayers = function() {
    const layers = [];

    for(const name in BattalionMap.LAYER) {
        const index = BattalionMap.LAYER[name];
        const layer = this.getLayer(index);

        layers.push(`"${name}": [${layer.encode()}]`);
    }

    return layers;
}