import { ActionQueue } from "../action/actionQueue.js";
import { TurnManager } from "./turn/turnManager.js";
import { EntityManager } from "../entity/entityManager.js";
import { MapManager } from "../map/mapManager.js";
import { WorldEventHandler } from "./event/worldEventHandler.js";
import { FloodFill } from "../pathfinders/floodFill.js";

export const World = function() {
    this.actionQueue = new ActionQueue();
    this.turnManager = new TurnManager();
    this.entityManager = new EntityManager();
    this.mapManager = new MapManager();
    this.eventHandler = new WorldEventHandler();
}

World.prototype.exit = function() {
    this.actionQueue.exit();
    this.turnManager.exit();
    this.entityManager.exit();
    this.mapManager.exit();
    this.eventHandler.exit();
}

World.prototype.update = function(gameContext) {
    this.actionQueue.update(gameContext);
    this.turnManager.update(gameContext);
    this.mapManager.update(gameContext);
    this.entityManager.update(gameContext);
}

World.prototype.getEntityAt = function(tileX, tileY) {
    const worldMap = this.mapManager.getActiveMap();

    if(!worldMap) {
        return null;
    }

    const entityID = worldMap.getEntity(tileX, tileY);
    const entity = this.entityManager.getEntity(entityID);

    return entity;
}

World.prototype.getEntitiesInRange = function(tileX, tileY, width, height) {
    const worldMap = this.mapManager.getActiveMap();
    const entities = [];

    if(!worldMap) {
        return entities;
    }

    const startX = tileX - width;
    const startY = tileY - height;
    const endX = tileX + width;
    const endY = tileY + height;

    for(let i = startY; i <= endY; i++) {
        for(let j = startX; j <= endX; j++) {
            const entityID = worldMap.getEntity(j, i);
            const entity = this.entityManager.getEntity(entityID);

            if(entity) {
                entities.push(entity);
            }
        }
    }

    return entities;
}

World.prototype.getEntitiesInArea = function(startX, startY, endX, endY) {
    const worldMap = this.mapManager.getActiveMap();
    const entities = [];

    if(!worldMap) {
        return entities;
    }

    for(let i = startY; i < endY; i++) {
        for(let j = startX; j < endX; j++) {
            const entityID = worldMap.getEntity(j, i);
            const entity = this.entityManager.getEntity(entityID);

            if(entity) {
                entities.push(entity);
            }
        }
    }

    return entities;
}

World.prototype.getEntitiesInAreaUnique = function(startX, startY, endX, endY) {
    const worldMap = this.mapManager.getActiveMap();
    const entities = [];

    if(!worldMap) {
        return entities;
    }

    const uniquedIDs = new Set();

    for(let i = startY; i < endY; i++) {
        for(let j = startX; j < endX; j++) {
            const entityID = worldMap.getEntity(j, i);

            if(entityID !== null && !uniquedIDs.has(entityID)) {
                const entity = this.entityManager.getEntity(entityID); 

                if(entity) {
                    entities.push(entity);
                    uniquedIDs.add(entityID);
                }
            }
        }
    }

    return entities;
}

World.prototype.getEntitiesAround = function(tileX, tileY) {
    const worldMap = this.mapManager.getActiveMap();
    const entities = [];

    if(!worldMap) {
        return entities;
    }

    for(let i = 0; i < FloodFill.NEIGHBORS.length; i++) {
        const [deltaX, deltaY, type] = FloodFill.NEIGHBORS[i];
        const neighborX = deltaX + tileX;
        const neighborY = deltaY + tileY;
        const entityID = worldMap.getEntity(neighborX, neighborY);
        const entity = this.entityManager.getEntity(entityID);

        if(entity) {
            entities.push(entity);
        }
    }
    
    return entities;
}

World.prototype.getEntitiesAroundFull = function(tileX, tileY) {
    const worldMap = this.mapManager.getActiveMap();
    const entities = [];

    if(!worldMap) {
        return entities;
    }

    for(let i = 0; i < FloodFill.ALL_NEIGHBORS.length; i++) {
        const [deltaX, deltaY, type] = FloodFill.ALL_NEIGHBORS[i];
        const neighborX = deltaX + tileX;
        const neighborY = deltaY + tileY;
        const entityID = worldMap.getEntity(neighborX, neighborY);
        const entity = this.entityManager.getEntity(entityID);

        if(entity) {
            entities.push(entity);
        }
    }
    
    return entities;
}

World.prototype.getEntitiesInLine = function(tileX, tileY, deltaX, deltaY, maxSteps) {
    const worldMap = this.mapManager.getActiveMap();
    const entities = [];

    let currentX = tileX + deltaX;
    let currentY = tileY + deltaY;
    let step = 0;

    while(step < maxSteps && !worldMap.isTileOutOfBounds(currentX, currentY)) {
        const entityID = worldMap.getEntity(currentX, currentY);
        const entity = this.entityManager.getEntity(entityID);

        if(entity) {
            entities.push(entity);
        }

        currentX += deltaX;
        currentY += deltaY;
        step++;
    }

    return entities;
}