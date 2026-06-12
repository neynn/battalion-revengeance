import { LanguageHandler } from "../../engine/language/languageHandler.js";
import { Layer } from "../../engine/map/layer.js";
import { WorldMap } from "../../engine/map/worldMap.js";
import { Building } from "../entity/building.js";
import { downgradeOre } from "../enumHelpers.js";
import { CLIMATE_TYPE, TILE_TYPE } from "../enums.js";
import { JammerTile } from "./jammerTile.js";
import { Pathfinder } from "./pathfinder.js";

export const BattalionMap = function(id, width, height) {
    WorldMap.call(this, id, width, height);

    this.scenario = null;
    this.name = "MAP_NAME";
    this.climate = CLIMATE_TYPE.TEMPERATE;
    this.buildings = [];
    this.mines = [];
    this.jammers = new Map();
    this.localization = new Map();
    this.pathfinder = new Pathfinder(width, height);
    this.flags = BattalionMap.FLAG.NONE;

    this.createLayer(Layer.TYPE.BIT_16);
    this.createLayer(Layer.TYPE.BIT_16);
    this.createLayer(Layer.TYPE.BIT_16);
}

BattalionMap.FLAG = {
    NONE: 0,
    USE_GLOBAL_CLIMATE: 1 << 0
};

BattalionMap.LAYER = {
    GROUND: 0,
    DECORATION: 1,
    CLOUD: 2
};

BattalionMap.SEARCH_ORDER = [
    BattalionMap.LAYER.CLOUD,
    BattalionMap.LAYER.DECORATION,
    BattalionMap.LAYER.GROUND
];

BattalionMap.getLayerIndex = function(name) {
    const index = BattalionMap.LAYER[name];

    if(index === undefined) {
        return WorldMap.INVALID_LAYER_ID;
    }

    return index;
}

BattalionMap.prototype = Object.create(WorldMap.prototype);
BattalionMap.prototype.constructor = BattalionMap;

BattalionMap.prototype.saveFlags = function() {
    const flags = [];

    for(const name in BattalionMap.FLAG) {
        if(this.flags & BattalionMap.FLAG[name]) {
            flags.push(name);
        }
    }

    return flags;
}

BattalionMap.prototype.loadFlags = function(flags) {
    for(let i = 0; i < flags.length; i++) {
        const flag = BattalionMap.FLAG[flags[i]];

        if(flag !== undefined) {
            this.flags |= flag;
        }
    }
}

BattalionMap.prototype.getClimateType = function(gameContext, tileX, tileY) {
    const { tileManager, typeRegistry } = gameContext;

    //Maps may have a global climate that overrides all.
    if(this.flags & BattalionMap.FLAG.USE_GLOBAL_CLIMATE) {
        return typeRegistry.getClimateType(this.climate);
    }

    if(!this.isTileOutOfBounds(tileX, tileY)) {
        for(const layerID of BattalionMap.SEARCH_ORDER) {
            const typeID = this.getTile(layerID, tileX, tileY);
            const logicalID = tileManager.getLogicalID(typeID);
            const { climate } = typeRegistry.getTileType(logicalID);

            //A climate type of NONE means falling through. This allows roads to be climate agnostic.
            //By default, every TileType has a climate of NONE.
            if(climate !== CLIMATE_TYPE.NONE) {
                return typeRegistry.getClimateType(climate);
            }
        }
    }

    return typeRegistry.getClimateType(this.climate);
}

BattalionMap.prototype.downgradeOreTile = function(tileX, tileY) {
    for(const layerID of BattalionMap.SEARCH_ORDER) {
        const tileID = this.getTile(layerID, tileX, tileY);
        const oreID = downgradeOre(tileID);

        this.setTile(oreID, layerID, tileX, tileY);
    }
}

BattalionMap.prototype.getTileType = function(gameContext, tileX, tileY) {
    const { tileManager, typeRegistry } = gameContext;

    if(this.isTileOutOfBounds(tileX, tileY)) {
        return typeRegistry.getTileType(TILE_TYPE.NONE);
    }

    for(const layerID of BattalionMap.SEARCH_ORDER) {
        const typeID = this.getTile(layerID, tileX, tileY);
        const logicalID = tileManager.getLogicalID(typeID);

        //Unknown tile types and empty tiles always use -1 (_INVALID).
        if(logicalID !== TILE_TYPE._INVALID && logicalID !== TILE_TYPE.NONE) {
            return typeRegistry.getTileType(logicalID);
        }
    }

    return typeRegistry.getTileType(TILE_TYPE.NONE);
}

BattalionMap.prototype.getTileName = function(gameContext, tileX, tileY) {
    const { language } = gameContext;
    const index = this.getIndex(tileX, tileY);
    const localization = this.localization.get(index);

    if(localization && localization.name !== LanguageHandler.INVALID_ID) {
        return language.getScenarioTranslation(localization.name);
    }

    const { name } = this.getTileType(gameContext, tileX, tileY);

    return language.getSystemTranslation(name);
}

BattalionMap.prototype.getTileDesc = function(gameContext, tileX, tileY) {
    const { language } = gameContext;
    const index = this.getIndex(tileX, tileY);
    const localization = this.localization.get(index);

    if(localization && localization.desc !== LanguageHandler.INVALID_ID) {
        return language.getScenarioTranslation(localization.desc);
    }

    const { desc } = this.getTileType(gameContext, tileX, tileY);

    return language.getSystemTranslation(desc);
}

BattalionMap.prototype.removeLocalization = function(tileX, tileY) {
    const index = this.getIndex(tileX, tileY);

    if(this.localization.has(index)) {
        this.localization.delete(index);
    }
}

BattalionMap.prototype.localizeTile = function(tileX, tileY, nameID, descID) {
    const index = this.getIndex(tileX, tileY);

    if(index !== WorldMap.OUT_OF_BOUNDS && !this.localization.has(index)) {
        this.localization.set(index, {
            "name": nameID,
            "desc": descID
        });
    }
}

BattalionMap.prototype.isMinePlaceable = function(gameContext, tileX, tileY, mineCategory) {
    const tileType = this.getTileType(gameContext, tileX, tileY);

    if(!tileType.allowsMine(mineCategory)) {
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

BattalionMap.prototype.createBuilding = function(gameContext, snapshot) {
    const { typeRegistry } = gameContext;
    const { tileX, tileY, type } = snapshot;

    if(!this.isBuildingPlaceable(tileX, tileY)) {
        return;
    }

    const buildingType = typeRegistry.getBuildingType(type);
    const index = this.buildings.length;
    const building = new Building(index, buildingType);

    building.tileX = tileX;
    building.tileY = tileY;
    building.load(snapshot);

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

BattalionMap.prototype.addJammer = function(tileX, tileY, entityID, teamID, flags) {
    const index = this.getIndex(tileX, tileY);

    if(index !== WorldMap.OUT_OF_BOUNDS) {
        const jammerTile = this.jammers.get(index);

        if(jammerTile) {
            jammerTile.addBlocker(entityID, teamID, flags);
        } else {
            const newTile = new JammerTile(tileX, tileY);

            newTile.addBlocker(entityID, teamID, flags);

            this.jammers.set(index, newTile);
        }
    }
}

BattalionMap.prototype.removeJammer = function(tileX, tileY, entityID, teamID, flags) {
    const index = this.getIndex(tileX, tileY);
    const jammerTile = this.jammers.get(index);

    if(jammerTile) {
        jammerTile.removeBlocker(entityID, teamID, flags);

        if(jammerTile.isEmpty()) {
            this.jammers.delete(index);
        }
    }
}

BattalionMap.prototype.isJammed = function(gameContext, tileX, tileY, teamID, flags) {
    const index = this.getIndex(tileX, tileY);
    const jammerTile = this.jammers.get(index);

    if(!jammerTile) {
        return false;
    }

    return jammerTile.isJammed(gameContext, teamID, flags);
}

BattalionMap.prototype.decodeLayers = function(layerData) {
    for(const layerID in BattalionMap.LAYER) {
        const data = layerData[layerID];

        if(data) {
            this.getLayer(BattalionMap.LAYER[layerID]).decode(data);
        } else {
            console.error("LayerData is not present!", layerID);
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