import { LanguageHandler } from "../../engine/language/languageHandler.js";
import { Layer } from "../../engine/map/layer.js";
import { WorldMap } from "../../engine/map/worldMap.js";
import { Building } from "../entity/building.js";
import { Mine } from "../entity/mine.js";
import { downgradeOre } from "../enumHelpers.js";
import { CLIMATE_TYPE, TILE_ID, TILE_TYPE } from "../enums.js";
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
    this.nextBuildingID = 1;
    this.nextMineID = 1;
    this.useGlobalClimate = false;

    this.createLayer(Layer.TYPE.BIT_16); //Bottom
    this.createLayer(Layer.TYPE.BIT_16); //Middle
    this.createLayer(Layer.TYPE.BIT_16); //Top
    this.createLayer(Layer.TYPE.BIT_8); //building_id
    this.createLayer(Layer.TYPE.BIT_16); //mine_id
}

BattalionMap.LAYER = {
    BOTTOM: 0,
    MIDDLE: 1,
    TOP: 2,
    BUILDING: 3,
    MINE: 4
};

BattalionMap.SEARCH_ORDER = [
    BattalionMap.LAYER.TOP,
    BattalionMap.LAYER.MIDDLE,
    BattalionMap.LAYER.BOTTOM
];

BattalionMap.prototype = Object.create(WorldMap.prototype);
BattalionMap.prototype.constructor = BattalionMap;

BattalionMap.prototype.explodeTile = function(gameContext, tileX, tileY) {
    const { tileManager, typeRegistry } = gameContext;

    if(this.isTileOutOfBounds(tileX, tileY)) {
        return;
    }

    for(const layerID of BattalionMap.SEARCH_ORDER) {
        const typeID = this.getTile(layerID, tileX, tileY);
        const logicalID = tileManager.getLogicalID(typeID);
        const { canExplode } = typeRegistry.getTileType(logicalID);

        if(canExplode) {
            this.setTile(TILE_ID.NONE, layerID, tileX, tileY);
        }
    }
}

BattalionMap.prototype.getClimateType = function(gameContext, tileX, tileY) {
    const { tileManager, typeRegistry } = gameContext;

    //Maps may have a global climate that overrides all.
    if(this.useGlobalClimate) {
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

        if(logicalID !== TILE_TYPE.NONE) {
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

BattalionMap.prototype.createMine = function(gameContext, type, tileX, tileY) {
    const { typeRegistry } = gameContext;
    const mineType = typeRegistry.getMineType(type);
    const mineID = this.nextMineID++;
    const mine = new Mine(mineID, mineType);

    this.mines.push(mine);

    if(this.getMine(tileX, tileY) === null) {
        this.setTile(mineID, BattalionMap.LAYER.MINE, tileX, tileY);

        mine.tileX = tileX;
        mine.tileY = tileY;
    }

    return mine;
}

BattalionMap.prototype.getMine = function(tileX, tileY) {
    const mineID = this.getTile(BattalionMap.LAYER.MINE, tileX, tileY);

    if(mineID > 0) {
        for(let i = 0; i < this.mines.length; i++) {
            if(this.mines[i].id === mineID) {
                return this.mines[i];
            }
        }
    }

    return null;
}

BattalionMap.prototype.removeMine = function(tileX, tileY) {
    const mineID = this.getTile(BattalionMap.LAYER.MINE, tileX, tileY);

    if(mineID <= 0) {
        return;
    }

    for(let i = 0; i < this.mines.length; i++) {
        if(this.mines[i].id === mineID) {
            this.mines[i] = this.mines[this.mines.length - 1];
            this.mines.pop();
            break;
        }
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

BattalionMap.prototype.createBuilding = function(gameContext, type, tileX, tileY) {
    const { typeRegistry } = gameContext;
    const buildingType = typeRegistry.getBuildingType(type);
    const index = this.buildings.length;
    const buildingID = this.nextBuildingID++;
    const building = new Building(buildingID, index, buildingType);

    this.buildings.push(building);

    if(this.getBuilding(tileX, tileY) === null) {
        this.setTile(buildingID, BattalionMap.LAYER.BUILDING, tileX, tileY);

        building.tileX = tileX;
        building.tileY = tileY;
    }

    return building;
}

BattalionMap.prototype.getBuilding = function(tileX, tileY) {
    const buildingID = this.getTile(BattalionMap.LAYER.BUILDING, tileX, tileY);

    if(buildingID > 0) {
        for(let i = 0; i < this.buildings.length; i++) {
            if(this.buildings[i].id === buildingID) {
                return this.buildings[i];
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

BattalionMap.prototype.decodeLayers = function(data) {
    let ptr = 0;
    const layerCount = data[ptr++];
    const bottomWidth = data[ptr++];
    const middleWidth = data[ptr++];
    const topWidth = data[ptr++];

    this.getLayer(BattalionMap.LAYER.BOTTOM).decode(data, bottomWidth, ptr);
    this.getLayer(BattalionMap.LAYER.MIDDLE).decode(data, middleWidth, ptr + bottomWidth);
    this.getLayer(BattalionMap.LAYER.TOP).decode(data, topWidth, ptr + bottomWidth + middleWidth);
}

BattalionMap.prototype.saveLayers = function() {
    const bottomLayer = this.getLayer(BattalionMap.LAYER.BOTTOM).encode();
    const middleLayer = this.getLayer(BattalionMap.LAYER.MIDDLE).encode();
    const topLayer = this.getLayer(BattalionMap.LAYER.TOP).encode();
    const data = [];
    let ptr = 0;

    data[ptr++] = 3;
    data[ptr++] = bottomLayer.length;
    data[ptr++] = middleLayer.length;
    data[ptr++] = topLayer.length;

    for(let i = 0; i < bottomLayer.length; i++) {
        data[ptr++] = bottomLayer[i];
    }

    for(let i = 0; i < middleLayer.length; i++) {
        data[ptr++] = middleLayer[i]
    }

    for(let i = 0; i < topLayer.length; i++) {
        data[ptr++] = topLayer[i];
    }

    return data;
}