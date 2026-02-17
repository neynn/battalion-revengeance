import { Layer } from "../../engine/map/layer.js";
import { WorldMap } from "../../engine/map/worldMap.js";
import { downgradeOre, oreToValue } from "../enumHelpers.js";
import { CLIMATE_TYPE, TILE_TYPE } from "../enums.js";
import { JammerTile } from "./jammerTile.js";

export const BattalionMap = function(id, width, height) {
    WorldMap.call(this, id, width, height);

    this.globalClimate = CLIMATE_TYPE.NONE;
    this.climate = CLIMATE_TYPE.NONE;
    this.localization = [];
    this.buildings = [];
    this.mines = [];
    this.edits = [];
    this.jammers = new Map();
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

BattalionMap.STUB_JAMMER = new JammerTile(-1, -1);

BattalionMap.getLayerIndex = function(name) {
    const index = BattalionMap.LAYER[name];

    if(index === undefined) {
        return WorldMap.INVALID_LAYER_ID;
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

    if(index !== WorldMap.OUT_OF_BOUNDS) {
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

BattalionMap.prototype.getOreValue = function(tileX, tileY) {
    for(const layerID of BattalionMap.SEARCH_ORDER) {
        const typeID = this.getTile(layerID, tileX, tileY);
        const value = oreToValue(typeID);

        if(value !== 0) {
            return value;
        }
    }

    return 0;
}

BattalionMap.prototype.extractOre = function(tileX, tileY) {
    for(const layerID of BattalionMap.SEARCH_ORDER) {
        const tileID = this.getTile(layerID, tileX, tileY);
        const oreID = downgradeOre(tileID);

        this.placeTile(oreID, layerID, tileX, tileY);
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

    for(let i = 0; i < this.localization.length; i++) {
        const { x, y, name } = this.localization[i];

        if(x === tileX && y === tileY) {
            return language.getMapTranslation(name);
        }
    }

    const { name } = this.getTileType(gameContext, tileX, tileY);

    return language.getSystemTranslation(name);
}

BattalionMap.prototype.getTileDesc = function(gameContext, tileX, tileY) {
    const { language } = gameContext;

    for(let i = 0; i < this.localization.length; i++) {
        const { x, y, desc } = this.localization[i];

        if(x === tileX && y === tileY) {
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
        const {
            x = -1,
            y = -1,
            name = "MISSING_LOCAL_NAME",
            desc = "MISSING_LOCAL_DESC"
        } = localization[i];

        const index = this.getIndex(x, y);

        if(index === WorldMap.OUT_OF_BOUNDS || indices.has(index)) {
            continue;
        }

        this.localization.push({
            "x": x,
            "y": y,
            "name": name,
            "desc": desc
        });

        indices.add(index);
    }
}

BattalionMap.prototype.isMinePlaceable = function(gameContext, tileX, tileY, mineType) {
    const tileType = this.getTileType(gameContext, tileX, tileY);

    if(!tileType.allowsMine(mineType)) {
        return false;
    }

    const index = this.getIndex(tileX, tileY);

    if(index === WorldMap.OUT_OF_BOUNDS) {
        return false;
    }

    if(this.getMine(tileX, tileY) !== null) {
        return false;
    } 

    return true;
}

BattalionMap.prototype.removeMine = function(tileX, tileY) {
    const index = this.getIndex(tileX, tileY);

    if(index === WorldMap.OUT_OF_BOUNDS) {
        return;
    }

    for(let i = 0; i < this.mines.length; i++) {
        if(this.mines[i].isPlacedOn(tileX, tileY)) {
            this.mines[i] = this.mines[this.mines.length - 1];
            this.mines.pop();
            break;
        }
    }
}

BattalionMap.prototype.addMine = function(mine) {
    this.mines.push(mine);
}

BattalionMap.prototype.getMine = function(tileX, tileY) {
    const index = this.getIndex(tileX, tileY);

    if(index === WorldMap.OUT_OF_BOUNDS) {
        return null;
    }

    for(let i = 0; i < this.mines.length; i++) {
        const mine = this.mines[i];

        if(mine.isPlacedOn(tileX, tileY)) {
            return mine;
        }
    }

    return null;
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
        const jammerTile = this.jammers.get(index);

        if(jammerTile) {
            jammerTile.addBlocker(teamID, flags);
        } else {
            const newTile = new JammerTile(tileX, tileY);

            newTile.addBlocker(teamID, flags);

            this.jammers.set(index, newTile);
        }
    }
}

BattalionMap.prototype.removeJammer = function(tileX, tileY, teamID, flags) {
    const index = this.getIndex(tileX, tileY);
    const jammerTile = this.jammers.get(index);

    if(jammerTile) {
        jammerTile.removeBlocker(teamID, flags);

        if(jammerTile.isEmpty()) {
            this.jammers.delete(index);
        }
    }
}

BattalionMap.prototype.getJammer = function(tileX, tileY) {
    const index = this.getIndex(tileX, tileY);
    const jammerTile = this.jammers.get(index);

    if(!jammerTile) {
        return BattalionMap.STUB_JAMMER;
    }

    return jammerTile;
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