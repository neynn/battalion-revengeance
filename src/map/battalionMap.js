import { LanguageHandler } from "../../engine/language/languageHandler.js";
import { Layer } from "../../engine/map/layer.js";
import { WorldMap } from "../../engine/map/worldMap.js";
import { downgradeOre, oreToValue } from "../enumHelpers.js";
import { CLIMATE_TYPE, TILE_TYPE } from "../enums.js";
import { JammerTile } from "./jammerTile.js";

export const BattalionMap = function(id, width, height, preview) {
    WorldMap.call(this, id, width, height);

    this.preview = preview;
    this.globalClimate = CLIMATE_TYPE.NONE;
    this.climate = CLIMATE_TYPE.NONE;
    this.buildings = [];
    this.mines = [];
    this.edits = [];
    this.movingEntities = [];
    this.jammers = new Map();
    this.localization = new Map();
    this.text = new Map();
    this.customs = new Map();

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

BattalionMap.INVALID_CUSTOM_ID = -1;

BattalionMap.getLayerIndex = function(name) {
    const index = BattalionMap.LAYER[name];

    if(index === undefined) {
        return WorldMap.INVALID_LAYER_ID;
    }

    return index;
}

BattalionMap.prototype = Object.create(WorldMap.prototype);
BattalionMap.prototype.constructor = BattalionMap;

BattalionMap.prototype.getCustomID = function(name) {
    const index = this.customs.get(name);

    if(index === undefined) {
        return BattalionMap.INVALID_CUSTOM_ID;
    }

    return index;
}

BattalionMap.prototype.getTextID = function(name) {
    const index = this.text.get(name);

    if(index === undefined) {
        return LanguageHandler.INVALID_ID;
    }

    return index;
}

BattalionMap.prototype.createCustomMapping = function(customs) {
    for(let i = 0; i < customs.length; i++) {
        this.customs.set(customs[i], i);
    }
}

BattalionMap.prototype.createTextMapping = function(text) {
    for(let i = 0; i < text.length; i++) {
        this.text.set(text[i], i);
    }
}

BattalionMap.prototype.addMoving = function(index) {
    if(!this.movingEntities.includes(index)) {
        this.movingEntities.push(index);
    }
}

BattalionMap.prototype.removeMoving = function(index) {
    for(let i = 0; i < this.movingEntities.length; i++) {
        if(this.movingEntities[i] === index) {
            this.movingEntities[i] = this.movingEntities[this.movingEntities.length - 1];
            this.movingEntities.pop();
            break;
        }
    }
}

BattalionMap.prototype.loadEdits = function(edits) {
    for(const { layer, index, previous, current } of edits) {
        this.getLayer(layer).setItem(current, index);
    }

    this.edits = edits;
}

BattalionMap.prototype.editTile = function(layerID, tileX, tileY, tileID) {
    const index = this.getIndex(tileX, tileY);

    if(index !== WorldMap.OUT_OF_BOUNDS) {
        const layer = this.getLayer(layerID);

        if(layer !== WorldMap.EMPTY_LAYER) {
            const previous = layer.getItem(index);

            layer.setItem(tileID, index);

            this.edits.push({
                "layer": layerID,
                "index": index,
                "previous": previous,
                "current": tileID
            });
        }
    }
}

BattalionMap.prototype.saveFlags = function() {
    return [];
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
            const { climate } = typeRegistry.getTileType(type);

            //A climate type of NONE means falling through. This allows roads to be climate agnostic.
            //By default, every TileType has a climate of NONE.
            if(climate !== CLIMATE_TYPE.NONE) {
                return typeRegistry.getClimateType(climate);
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

        //Unknown tile types and empty tiles always use -1 (_INVALID).
        if(type !== TILE_TYPE._INVALID && type !== TILE_TYPE.NONE) {
            return typeRegistry.getTileType(type);
        }
    }

    return typeRegistry.getTileType(TILE_TYPE.NONE);
}

BattalionMap.prototype.getTileName = function(gameContext, tileX, tileY) {
    const { language } = gameContext;
    const index = this.getIndex(tileX, tileY);
    const localization = this.localization.get(index);

    if(localization && localization.name !== LanguageHandler.INVALID_ID) {
        return language.getMapTranslation(localization.name);
    }

    const { name } = this.getTileType(gameContext, tileX, tileY);

    return language.getSystemTranslation(name);
}

BattalionMap.prototype.getTileDesc = function(gameContext, tileX, tileY) {
    const { language } = gameContext;
    const index = this.getIndex(tileX, tileY);
    const localization = this.localization.get(index);

    if(localization && localization.desc !== LanguageHandler.INVALID_ID) {
        return language.getMapTranslation(localization.desc);
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

BattalionMap.prototype.loadLocalization = function(localization) {
    for(let i = 0; i < localization.length; i++) {
        const {
            x = -1,
            y = -1,
            name = "",
            desc = ""
        } = localization[i];

        const index = this.getIndex(x, y);

        if(index === WorldMap.OUT_OF_BOUNDS || this.localization.has(index)) {
            continue;
        }

        const nameID = this.getTextID(name);
        const descID = this.getTextID(desc);

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

BattalionMap.prototype.addJammer = function(tileX, tileY, entityID, teamID, flags) {
    const index = this.getIndex(tileX, tileY);

    if(index !== WorldMap.OUT_OF_BOUNDS) {
        const jammerTile = this.jammers.get(index);

        if(jammerTile) {
            jammerTile.addBlocker(entityID, teamID, flags);
        } else {
            const newTile = new JammerTile();

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