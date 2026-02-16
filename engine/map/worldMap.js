import { EntityManager } from "../entity/entityManager.js";
import { FloodFill } from "../pathfinders/floodFill.js";
import { Autotiler } from "../tile/autotiler.js";
import { TileManager } from "../tile/tileManager.js";
import { Layer } from "./layer.js";

export const WorldMap = function(id, width, height) {
    const BUFFER_SIZE = width * height;

    this.id = id;
    this.width = width;
    this.height = height;
    this.layers = [];
    this.entities = new Int16Array(BUFFER_SIZE);
    this.entities.fill(EntityManager.INVALID_ID);
}

WorldMap.EMPTY_LAYER = Layer.create(0, Layer.TYPE.BIT_0);
WorldMap.OUT_OF_BOUNDS = -1;
WorldMap.INVALID_LAYER_ID = -1;

WorldMap.prototype.update = function(gameContext) {}

WorldMap.prototype.getID = function() {
    return this.id;
}

WorldMap.prototype.applyAutotiler = function(autotiler, tileX, tileY, layerID, isInverted) {
    const tileID = this.getTile(layerID, tileX, tileY);

    if(tileID === WorldMap.OUT_OF_BOUNDS || !autotiler.hasMember(tileID)) {
        return TileManager.TILE_ID.EMPTY;
    }

    const responseID = autotiler.run(tileX, tileY, (x, y) => {
        const nextID = this.getTile(layerID, x, y);

        if(nextID === WorldMap.OUT_OF_BOUNDS) {
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

WorldMap.prototype.getLayer = function(index) {
    if(index < 0 || index >= this.layers.length) {
        return WorldMap.EMPTY_LAYER;
    }

    return this.layers[index];
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
        return WorldMap.OUT_OF_BOUNDS;
    }

    return tileY * this.width + tileX;
}

WorldMap.prototype.isTileOccupied = function(tileX, tileY) {
    const entityID = this.getEntity(tileX, tileY);

    return entityID !== EntityManager.INVALID_ID;
}

WorldMap.prototype.hasEntity = function(tileX, tileY, targetID) {
    const entityID = this.getEntity(tileX, tileY);

    return entityID === targetID;
} 

WorldMap.prototype.removeEntity = function(tileX, tileY, rangeX, rangeY, entityID) {
    for(let i = 0; i < rangeY; i++) {
        const locationY = tileY + i;

        for(let j = 0; j < rangeX; j++) {
            const locationX = tileX + j;
            const index = this.getIndex(locationX, locationY);

            if(index !== WorldMap.OUT_OF_BOUNDS) {
                this.entities[index] = EntityManager.INVALID_ID;
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

            if(index !== WorldMap.OUT_OF_BOUNDS) {
                if(this.entities[index] === EntityManager.INVALID_ID) {
                    this.entities[index] = entityID;
                }
            }
        }
    }
}

WorldMap.prototype.setLayerAlpha = function(index, alpha) {
    this.getLayer(index).setAlpha(alpha);
} 

WorldMap.prototype.resize = function(width, height) {
    for(let i = 0; i < this.layers.length; i++) {
        this.layers[i].resize(this.width, this.height, width, height);
    }

    const BUFFER_SIZE = width * height;
    const newEntities = new Int16Array(BUFFER_SIZE);

    newEntities.fill(EntityManager.INVALID_ID);
    Layer.copyBuffer(this.entities, newEntities, this.width, this.height, width, height);

    this.width = width;
    this.height = height;
    this.entities = newEntities;
}

WorldMap.prototype.clearTile = function(layerID, tileX, tileY) {
    if(this.isTileOutOfBounds(tileX, tileY)) {
        console.warn(`Tile ${tileY},${tileX} does not exist! Returning...`);
        return;
    }

    const layer = this.getLayer(layerID);
    const index = tileY * this.width + tileX;
    
    layer.setItem(0, index);
}

WorldMap.prototype.placeTile = function(data, layerID, tileX, tileY) {
    if(typeof data !== "number") {
        console.warn(`Data ${data} is not a number! It is ${typeof data}! Returning...`);
        return;
    }

    if(this.isTileOutOfBounds(tileX, tileY)) {
        console.warn(`Tile ${tileY},${tileX} does not exist! Returning...`);
        return;
    }

    const layer = this.getLayer(layerID);
    const index = tileY * this.width + tileX;

    layer.setItem(data, index);
}

WorldMap.prototype.isTileOutOfBounds = function(tileX, tileY) {
    return tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height;
}

WorldMap.prototype.getTile = function(layerID, tileX, tileY) {
    if(this.isTileOutOfBounds(tileX, tileY)) {
        console.warn(`Tile [${tileY}|${tileX}] is out of bounds!`);
        return WorldMap.OUT_OF_BOUNDS;
    }

    const layer = this.getLayer(layerID);
    const index = tileY * this.width + tileX;
    const item = layer.getItem(index);

    return item;
}

WorldMap.prototype.getEntity = function(tileX, tileY) {
    const index = this.getIndex(tileX, tileY);

    if(index !== WorldMap.OUT_OF_BOUNDS) {
        return this.entities[index];
    }

    return EntityManager.INVALID_ID;
}

WorldMap.prototype.getAllEntitiesInArea = function(startX, startY, endX, endY) {
    const entities = [];

    for(let i = startY; i < endY; i++) {
        for(let j = startX; j < endX; j++) {
            const entityID = this.getEntity(j, i);

            if(entityID !== EntityManager.INVALID_ID) {
                entities.push(entityID);
            }
        }
    }

    return entities;
}

WorldMap.prototype.getEntitiesInAreaUnique = function(startX, startY, endX, endY) {
    const entities = [];

    for(let i = startY; i < endY; i++) {
        for(let j = startX; j < endX; j++) {
            const entityID = this.getEntity(j, i);

            if(entityID !== EntityManager.INVALID_ID && !entities.includes(entityID)) {
                entities.push(entityID);
            }
        }
    }

    return entities;
}

WorldMap.prototype.createLayer = function(type) {
    const bufferSize = this.width * this.height;
    const layer = Layer.create(bufferSize, type); 

    this.layers.push(layer);
}

WorldMap.prototype.fill2DGraph = function(startX, startY, range, onFill) {
    const list = FloodFill.LISTS[range];

    if(list !== undefined) {
        for(let i = 0; i < list.length; i += 3) {
            const deltaX = list[i];
            const deltaY = list[i + 1];
            const distance = list[i + 2];
            const tileX = startX + deltaX;
            const tileY = startY + deltaY;

            if(!this.isTileOutOfBounds(tileX, tileY)) {
                const index = tileY * this.width + tileX;

                onFill(tileX, tileY, distance, index);
            }
        }

        return;
    }

    const queue = [];
    const visited = new Set();
    const startID = startY * this.width + startX;
    let index = 0;

    visited.add(startID);
    queue.push({ "x": startX, "y": startY, "cost": 0 });

    if(!this.isTileOutOfBounds(startX, startY)) {
        onFill(startX, startY, 0, startID);
    }

    while(index < queue.length) {
        const { x, y, cost } = queue[index++];
        const neighborCost = cost + 1;

        if(neighborCost > range) {
            continue;
        }

        for(let i = 0; i < FloodFill.NEIGHBORS.length; i++) {
            const [deltaX, deltaY] = FloodFill.NEIGHBORS[i];
            const neighborX = x + deltaX;
            const neighborY = y + deltaY;
            const neighborID = neighborY * this.width + neighborX;

            if(!visited.has(neighborID) && !this.isTileOutOfBounds(neighborX, neighborY)) {
                onFill(neighborX, neighborY, neighborCost, neighborID);
                visited.add(neighborID);
                queue.push({ "x": neighborX, "y": neighborY, "cost": neighborCost });
            } 
        }
    }
}