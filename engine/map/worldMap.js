import { Autotiler } from "../tile/autotiler.js";
import { TileManager } from "../tile/tileManager.js";
import { Layer } from "./layer.js";

export const WorldMap = function(id) {
    this.id = id;
    this.width = 0;
    this.height = 0;
    this.flags = 0;
    this.layers = new Map();
    this.entities = new Map();
    this.music = null;
    this.flags = 0;
}

WorldMap.prototype.onLanguageUpdate = function(languageID, language) {}

WorldMap.prototype.hasFlag = function(flag) {
    return (this.flags & flag) !== 0;
}

WorldMap.prototype.load = function(blob) {}

WorldMap.prototype.save = function() {
    return {
        "id": this.id
    }
}

WorldMap.prototype.update = function(gameContext) {}

WorldMap.prototype.getID = function() {
    return this.id;
}

WorldMap.prototype.saveLayers = function() {
    const layers = [];

    for(const [layerID, layer] of this.layers) {
        const { autoGenerate } = layer;

        if(!autoGenerate) {
            layers.push(`"${layerID}": [${layer.encode()}]`);
        }
    }

    return layers;
}

WorldMap.prototype.applyAutotiler = function(autotiler, tileX, tileY, layerID, isInverted) {
    const tileID = this.getTile(layerID, tileX, tileY);

    if(tileID === -1 || !autotiler.hasMember(tileID)) {
        return TileManager.TILE_ID.EMPTY;
    }

    const responseID = autotiler.run(tileX, tileY, (x, y) => {
        const nextID = this.getTile(layerID, x, y);

        if(nextID === -1) {
            if(isInverted) {
                return Autotiler.RESPONSE.INVALID;
            } else {
                return Autotiler.RESPONSE.VALID;
            }
        }

        if(!autotiler.hasMember(nextID)) {
            return Autotiler.RESPONSE.INVALID;
        }

        return Autotiler.RESPONSE.VALID;
    });

    if(responseID !== TileManager.TILE_ID.EMPTY) {
        this.placeTile(responseID, layerID, tileX, tileY);
    }

    return responseID;
}

WorldMap.prototype.getLayer = function(layerID) {
    const layer = this.layers.get(layerID);

    if(!layer) {
        return null;
    }

    return layer;
}

WorldMap.prototype.getTileCoords = function(index) {
    const tileY = Math.floor(index / this.width);
    const tileX = index % this.width;

    if(this.isTileOutOfBounds(tileX, tileY)) {
        return {
            "x": -1,
            "y": -1
        };
    }

    return {
        "x": tileX,
        "y": tileY
    }
}

WorldMap.prototype.getIndex = function(tileX, tileY) {
    if(this.isTileOutOfBounds(tileX, tileY)) {
        return -1;
    }

    return tileY * this.width + tileX;
}

WorldMap.prototype.getEntities = function(tileX, tileY) {
    const index = this.getIndex(tileX, tileY);
    const list = this.entities.get(index);

    if(!list) {
        return [];
    }

    return list;
}

WorldMap.prototype.getTopEntity = function(tileX, tileY) {
    const index = this.getIndex(tileX, tileY);
    const list = this.entities.get(index);

    if(!list || list.length === 0) {
        return null;
    }

    return list[list.length - 1];
}

WorldMap.prototype.getBottomEntity = function(tileX, tileY) {
    const index = this.getIndex(tileX, tileY);
    const list = this.entities.get(index);

    if(!list || list.length === 0) {
        return null;
    }

    return list[0];
}

WorldMap.prototype.isTileOccupied = function(tileX, tileY) {
    const index = this.getIndex(tileX, tileY);
    const list = this.entities.get(index);

    if(!list) {
        return false;
    }

    return list.length > 0;
}

WorldMap.prototype.removeEntity = function(tileX, tileY, rangeX, rangeY, entityID) {
    for(let i = 0; i < rangeY; i++) {
        const locationY = tileY + i;

        for(let j = 0; j < rangeX; j++) {
            const locationX = tileX + j;
            const index = this.getIndex(locationX, locationY);

            if(index !== -1) {
                const list = this.entities.get(index);

                if(!list) {
                    continue;
                }
            
                for(let i = 0; i < list.length; i++) {
                    const entry = list[i];
            
                    if(entry === entityID) {
                        list.splice(i, 1);
                        break;
                    }
                }
            
                if(list.length === 0) {
                    this.entities.delete(index);
                }
            }
        }
    }
}

WorldMap.prototype.addEntity = function(tileX, tileY, rangeX, rangeY, entityID) {
    for(let i = 0; i < rangeY; i++) {
        const locationY = tileY + i;

        for(let j = 0; j < rangeX; j++) {
            const locationX = tileX + j;
            const index = this.getIndex(locationX, locationY);

            if(index !== -1) {
                const list = this.entities.get(index);

                if(!list) {
                    this.entities.set(index, [entityID]);
                } else {
                    list.push(entityID);
                }
            }
        }
    }
}

WorldMap.prototype.setLayerAlpha = function(layerID, alpha) {
    const layer = this.layers.get(layerID);

    if(layer && alpha !== undefined) {
        layer.setAlpha(alpha);
    }
} 

WorldMap.prototype.resize = function(width, height) {
    this.layers.forEach(layer => layer.resize(this.width, this.height, width, height));
    this.width = width;
    this.height = height;
}

WorldMap.prototype.clearTile = function(layerID, tileX, tileY) {
    const layer = this.layers.get(layerID);

    if(!layer) {
        console.warn(`Layer ${layerID} does not exist! Returning...`);
        return;
    }

    if(this.isTileOutOfBounds(tileX, tileY)) {
        console.warn(`Tile ${tileY},${tileX} does not exist! Returning...`);
        return;
    }

    const index = tileY * this.width + tileX;
    
    layer.setItem(0, index);
}

WorldMap.prototype.placeTile = function(data, layerID, tileX, tileY) {
    const layer = this.layers.get(layerID);

    if(!layer) {
        console.warn(`Layer ${layerID} does not exist! Returning...`);
        return;
    }

    if(typeof data !== "number") {
        console.warn(`Data ${data} is not a number! It is ${typeof data}! Returning...`);
        return;
    }

    if(this.isTileOutOfBounds(tileX, tileY)) {
        console.warn(`Tile ${tileY},${tileX} does not exist! Returning...`);
        return;
    }

    const index = tileY * this.width + tileX;

    layer.setItem(data, index);
}

WorldMap.prototype.isTileOutOfBounds = function(tileX, tileY) {
    return tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height;
}

WorldMap.prototype.getTile = function(layerID, tileX, tileY) {
    const layer = this.layers.get(layerID);

    if(!layer) {
        console.warn(`Layer ${layerID} does not exist!`);
        return -1;
    }

    if(this.isTileOutOfBounds(tileX, tileY)) {
        console.warn(`Tile [${tileY}|${tileX}] is out of bounds!`);
        return -1;
    }

    const index = tileY * this.width + tileX;
    const item = layer.getItem(index);

    return item;
}

WorldMap.prototype.getAllEntitiesInArea = function(startX, startY, endX, endY) {
    const entities = [];

    for(let i = startY; i < endY; i++) {
        for(let j = startX; j < endX; j++) {
            const entityID = this.getTopEntity(j, i);

            if(entityID !== null) {
                entities.push(entityID);
            }
        }
    }

    return entities;
}

WorldMap.prototype.getUniqueEntitiesInArea = function(startX, startY, endX, endY) {
    const entities = new Set();

    for(let i = startY; i < endY; i++) {
        for(let j = startX; j < endX; j++) {
            const entityID = this.getTopEntity(j, i);

            if(entityID !== null && !entities.has(entityID)) {
                entities.add(entityID);
            }
        }
    }

    return entities;
}

WorldMap.prototype.createLayer = function(id) {
    if(this.layers.has(id)) {
        return this.layers.get(id);
    }

    const layer = new Layer();

    this.layers.set(id, layer);

    return layer;
}

WorldMap.prototype.loadLayersEmpty = function(gameContext, layerData) {
    const { tileManager } = gameContext;
    const containerCount = tileManager.getContainerCount();
    const bufferSize = this.width * this.height;

    for(const layerID in layerData) {
        const { fill } = layerData[layerID];
        const layer = this.createLayer(layerID);

        layer.initBuffer(bufferSize, containerCount);
        layer.fill(fill);
    }
}

WorldMap.prototype.loadLayers = function(gameContext, layerData) {
    const { tileManager } = gameContext;
    const containerCount = tileManager.getContainerCount();
    const bufferSize = this.width * this.height;

    for(const layerID in layerData) {
        const layer = this.createLayer(layerID);

        layer.initBuffer(bufferSize, containerCount);
        layer.decode(layerData[layerID]);
    }
}