import { LanguageHandler } from "../../engine/language/languageHandler.js";
import { Layer } from "../../engine/map/layer.js";
import { WorldMap } from "../../engine/map/worldMap.js";
import { Building } from "../entity/building.js";
import { TypeHelper } from "../type/typeHelper.js";
import { TypeRegistry } from "../type/typeRegistry.js";

export const BattalionMap = function(id) {
    WorldMap.call(this, id);

    this.createLayer(BattalionMap.LAYER.FLAG, Layer.TYPE.BIT_8);
    this.createLayer(BattalionMap.LAYER.TEAM, Layer.TYPE.BIT_8);
    this.globalClimate = TypeRegistry.CLIMATE_TYPE.NONE;
    this.climate = TypeRegistry.CLIMATE_TYPE.NONE;
    this.localization = [];
    this.music = null;
    this.buildings = new Map();
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

BattalionMap.prototype.getClimateType = function(gameContext, tileX, tileY) {
    if(this.globalClimate !== TypeRegistry.CLIMATE_TYPE.NONE) {
        return this.globalClimate;
    }

    if(!this.isTileOutOfBounds(tileX, tileY)) {
        const { tileManager } = gameContext;
        const layers = [BattalionMap.LAYER.CLOUD, BattalionMap.LAYER.DECORATION, BattalionMap.LAYER.GROUND];

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
    }

    if(this.climate !== TypeRegistry.CLIMATE_TYPE.NONE) {
        return this.climate;
    }

    return TypeRegistry.CLIMATE_TYPE.TEMPERATE;
}

BattalionMap.prototype.getTerrainTags = function(gameContext, tileX, tileY) {
    const tags = new Set();

    if(this.isTileOutOfBounds(tileX, tileY)) {
        return tags;
    }

    const { tileManager } = gameContext;
    const layers = [BattalionMap.LAYER.GROUND, BattalionMap.LAYER.DECORATION, BattalionMap.LAYER.CLOUD];

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

BattalionMap.prototype.getTileType = function(gameContext, tileX, tileY) {
    if(this.isTileOutOfBounds(tileX, tileY)) {
        return TypeRegistry.TILE_TYPE.NONE;
    }

    const { tileManager } = gameContext;
    const layers = [BattalionMap.LAYER.CLOUD, BattalionMap.LAYER.DECORATION, BattalionMap.LAYER.GROUND];

    for(const layerID of layers) {
        const typeID = this.getTile(layerID, tileX, tileY);
        const meta = tileManager.getMeta(typeID);

        if(meta) {
            const { type = TypeRegistry.TILE_TYPE.NONE } = meta;

            if(type !== TypeRegistry.TILE_TYPE.NONE) {
                return type;
            }
        }
    }

    return TypeRegistry.TILE_TYPE.NONE;
}

BattalionMap.prototype.getTileName = function(gameContext, tileX, tileY) {
    const { language, typeRegistry } = gameContext;

    if(this.isTileOutOfBounds(tileX, tileY)) {
        return language.get("MISSING_TILE_NAME");
    }

    for(let i = 0; i < this.localization.length; i++) {
        const { x = -1, y = -1, name } = this.localization[i];

        if(x === tileX && y === tileY && name) {
            return language.get(name, LanguageHandler.TAG_TYPE.MAP);
        }
    }

    const typeID = this.getTileType(gameContext, tileX, tileY);
    const tileType = typeRegistry.getType(typeID, TypeRegistry.CATEGORY.TILE);

    if(tileType && tileType.name) {
        return language.get(tileType.name);
    }

    return language.get("MISSING_TILE_NAME");
}

BattalionMap.prototype.getTileDesc = function(gameContext, tileX, tileY) {
    const { language, typeRegistry } = gameContext;

    if(this.isTileOutOfBounds(tileX, tileY)) {
        return language.get("MISSING_TILE_DESC");
    }

    for(let i = 0; i < this.localization.length; i++) {
        const { x = -1, y = -1, desc } = this.localization[i];

        if(x === tileX && y === tileY && desc) {
            return language.get(desc, LanguageHandler.TAG_TYPE.MAP);
        }
    }

    const typeID = this.getTileType(gameContext, tileX, tileY);
    const tileType = typeRegistry.getType(typeID, TypeRegistry.CATEGORY.TILE);

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
        const { x = -1, y = -1, name = null, desc = null} = localization[i];
        const index = this.getIndex(x, y);

        if(index !== -1) {
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

    if(index !== -1) {
        if(!this.buildings.has(index)) {
            const building = onCreate(index);

            this.buildings.set(index, building);

            return building;
        }
    }

    return null;
}

BattalionMap.prototype.createBuilding = function(tileX, tileY, onCreate) {
    const index = this.getIndex(tileX, tileY);

    if(index !== -1) {
        if(!this.buildings.has(index)) {
            const building = onCreate(index);

            this.buildings.set(index, building);

            return building;
        }
    }

    return null;
}

BattalionMap.prototype.getBuilding = function(tileX, tileY) {
    const index = this.getIndex(tileX, tileY);

    if(index !== -1) {
        const building = this.buildings.get(index);

        if(building) {
            return building;
        }
    }

    return null;
}