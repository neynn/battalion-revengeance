import { LanguageHandler } from "../../engine/language/languageHandler.js";
import { Layer } from "../../engine/map/layer.js";
import { WorldMap } from "../../engine/map/worldMap.js";
import { TypeRegistry } from "../type/typeRegistry.js";
import { JammerField } from "./jammerField.js";

export const BattalionMap = function(id) {
    WorldMap.call(this, id);

    this.createLayer(BattalionMap.LAYER.FLAG, Layer.TYPE.BIT_8);
    this.createLayer(BattalionMap.LAYER.TEAM, Layer.TYPE.BIT_8);
    this.globalClimate = TypeRegistry.CLIMATE_TYPE.NONE;
    this.climate = TypeRegistry.CLIMATE_TYPE.NONE;
    this.localization = [];
    this.buildings = [];
    this.jammerFields = new Map();
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

BattalionMap.prototype.setClimate = function(local, global) {
    this.climate = local ?? TypeRegistry.CLIMATE_TYPE.NONE;
    this.globalClimate = global ?? TypeRegistry.CLIMATE_TYPE.NONE;
}

BattalionMap.prototype.getClimateTypeObject = function(gameContext, tileX, tileY) {
    const { typeRegistry } = gameContext;
    const typeID = this.getClimateType(gameContext, tileX, tileY);

    return typeRegistry.getType(typeID, TypeRegistry.CATEGORY.CLIMATE);
}

BattalionMap.prototype.getClimateType = function(gameContext, tileX, tileY) {
    if(this.globalClimate !== TypeRegistry.CLIMATE_TYPE.NONE) {
        return this.globalClimate;
    }

    if(!this.isTileOutOfBounds(tileX, tileY)) {
        const { tileManager, typeRegistry } = gameContext;
        const layers = [BattalionMap.LAYER.CLOUD, BattalionMap.LAYER.DECORATION, BattalionMap.LAYER.GROUND];

        for(const layerID of layers) {
            const typeID = this.getTile(layerID, tileX, tileY);
            const { type } = tileManager.getTile(typeID);

            if(type !== null) {
                const typeObject = typeRegistry.getType(type, TypeRegistry.CATEGORY.TILE);

                if(typeObject) {
                    const { climate = TypeRegistry.CLIMATE_TYPE.NONE } = typeObject;

                    if(climate !== TypeRegistry.CLIMATE_TYPE.NONE) {
                        return climate;
                    }
                }
            }
        }
    }

    if(this.climate !== TypeRegistry.CLIMATE_TYPE.NONE) {
        return this.climate;
    }

    return TypeRegistry.CLIMATE_TYPE.TEMPERATE;
}

BattalionMap.prototype.getTerrainTypes = function(gameContext, tileX, tileY) {
    if(this.isTileOutOfBounds(tileX, tileY)) {
        return [];
    }

    const { tileManager, typeRegistry } = gameContext;
    const layers = [BattalionMap.LAYER.CLOUD, BattalionMap.LAYER.DECORATION, BattalionMap.LAYER.GROUND];

    for(const layerID of layers) {
        const typeID = this.getTile(layerID, tileX, tileY);
        const { type } = tileManager.getTile(typeID);

        if(type !== null && type !== TypeRegistry.TILE_TYPE.NONE) {
            const tileType = typeRegistry.getType(type, TypeRegistry.CATEGORY.TILE);

            if(tileType) {
                return tileType.terrain ?? [];
            }
        }
    }

    return [];
}

BattalionMap.prototype.getTileTypeObject = function(gameContext, tileX, tileY) {
    const { typeRegistry } = gameContext;
    const typeID = this.getTileType(gameContext, tileX, tileY);

    return typeRegistry.getType(typeID, TypeRegistry.CATEGORY.TILE);
}

BattalionMap.prototype.getTileType = function(gameContext, tileX, tileY) {
    if(this.isTileOutOfBounds(tileX, tileY)) {
        return TypeRegistry.TILE_TYPE.NONE;
    }

    const { tileManager } = gameContext;
    const layers = [BattalionMap.LAYER.CLOUD, BattalionMap.LAYER.DECORATION, BattalionMap.LAYER.GROUND];

    for(const layerID of layers) {
        const typeID = this.getTile(layerID, tileX, tileY);
        const { type } = tileManager.getTile(typeID);

        if(type !== null && type !== TypeRegistry.TILE_TYPE.NONE) {
            return type;
        }
    }

    return TypeRegistry.TILE_TYPE.NONE;
}

BattalionMap.prototype.getTileName = function(gameContext, tileX, tileY) {
    const { language } = gameContext;

    if(this.isTileOutOfBounds(tileX, tileY)) {
        return language.get("MISSING_TILE_NAME");
    }

    for(let i = 0; i < this.localization.length; i++) {
        const { x = -1, y = -1, name } = this.localization[i];

        if(x === tileX && y === tileY && name) {
            return language.get(name, LanguageHandler.TAG_TYPE.MAP);
        }
    }

    const tileType = this.getTileTypeObject(gameContext, tileX, tileY);

    if(tileType && tileType.name) {
        return language.get(tileType.name);
    }

    return language.get("MISSING_TILE_NAME");
}

BattalionMap.prototype.getTileDesc = function(gameContext, tileX, tileY) {
    const { language } = gameContext;

    if(this.isTileOutOfBounds(tileX, tileY)) {
        return language.get("MISSING_TILE_DESC");
    }

    for(let i = 0; i < this.localization.length; i++) {
        const { x = -1, y = -1, desc } = this.localization[i];

        if(x === tileX && y === tileY && desc) {
            return language.get(desc, LanguageHandler.TAG_TYPE.MAP);
        }
    }

    const tileType = this.getTileTypeObject(gameContext, tileX, tileY);

    if(tileType && tileType.desc) {
        return language.get(tileType.desc);
    }

    return language.get("MISSING_TILE_DESC");
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

BattalionMap.prototype.createBuilding = function(tileX, tileY, onCreate) {
    const index = this.getIndex(tileX, tileY);

    if(index !== WorldMap.OUT_OF_BOUNDS) {
        if(!this.getBuilding(tileX, tileY)) {
            const building = onCreate();

            this.buildings.push(building);

            return building;
        }
    }

    return null;
}

BattalionMap.prototype.getBuilding = function(targetX, targetY) {
    const index = this.getIndex(targetX, targetY);

    if(index !== WorldMap.OUT_OF_BOUNDS) {
        for(let i = 0; i < this.buildings.length; i++) {
            const building = this.buildings[i];
            const { tileX, tileY } = building;

            if(targetX === tileX && targetY === tileY) {
                return building;
            }
        }
    }

    return null;
}

BattalionMap.prototype.addJammer = function(tileX, tileY) {
    const index = this.getIndex(tileX, tileY);

    if(index !== WorldMap.OUT_OF_BOUNDS) {
        const jammerField = this.jammerFields.get(index);

        if(jammerField) {
            jammerField.addBlocker();
        } else {
            const newField = new JammerField(tileX, tileY);

            newField.addBlocker();

            this.jammerFields.set(index, newField);
        }
    }
}

BattalionMap.prototype.removeJammer = function(tileX, tileY) {
    const index = this.getIndex(tileX, tileY);
    const jammerField = this.jammerFields.get(index);

    if(jammerField) {
        jammerField.removeBlocker();

        if(jammerField.blockers === 0) {
            this.jammerFields.delete(index);
        }
    }
}

BattalionMap.prototype.isJammed = function(tileX, tileY, movementType) {
    const index = this.getIndex(tileX, tileY);
    const jammerField = this.jammerFields.get(index);
    const isJammed = jammerField && jammerField.isJammed(movementType);

    return isJammed;
}