import { ActionQueue } from "../action/actionQueue.js";
import { ActorManager } from "./actor/actorManager.js";
import { EntityManager } from "../entity/entityManager.js";
import { WorldEventRegistry } from "./event/worldEventRegistry.js";
import { FloodFill } from "../pathfinders/floodFill.js";

export const World = function() {
    this.worldMap = null;
    this.actionQueue = new ActionQueue();
    this.actorManager = new ActorManager();
    this.entityManager = new EntityManager();
    this.eventHandler = new WorldEventRegistry();
}

World.prototype.exit = function() {
    this.actionQueue.exit();
    this.actorManager.exit();
    this.entityManager.exit();
    this.eventHandler.exit();
    this.worldMap = null;
}

World.prototype.update = function(gameContext) {
    this.actionQueue.update(gameContext);
    this.actorManager.update(gameContext);
    this.entityManager.update(gameContext);

    if(this.worldMap) {
        this.worldMap.update(gameContext);
    }
}

World.prototype.setWorldMap = function(worldMap) {
    this.worldMap = worldMap;
}

World.prototype.getWorldMap = function() {
    return this.worldMap;
}

World.prototype.getEntityAt = function(tileX, tileY) {
    if(!this.worldMap) {
        return null;
    }

    const index = this.worldMap.getEntity(tileX, tileY);
    const entity = this.entityManager.getEntityByIndex(index);

    return entity;
}

World.prototype.getEntitiesInRange = function(tileX, tileY, width, height) {
    const entities = [];

    if(!this.worldMap) {
        return entities;
    }

    const startX = tileX - width;
    const startY = tileY - height;
    const endX = tileX + width;
    const endY = tileY + height;

    for(let i = startY; i <= endY; i++) {
        for(let j = startX; j <= endX; j++) {
            const index = this.worldMap.getEntity(j, i);
            const entity = this.entityManager.getEntityByIndex(index);

            if(entity) {
                entities.push(entity);
            }
        }
    }

    return entities;
}

World.prototype.getEntitiesInArea = function(startX, startY, endX, endY) {
    const entities = [];

    if(!this.worldMap) {
        return entities;
    }

    for(let i = startY; i < endY; i++) {
        for(let j = startX; j < endX; j++) {
            const index = this.worldMap.getEntity(j, i);
            const entity = this.entityManager.getEntityByIndex(index);

            if(entity) {
                entities.push(entity);
            }
        }
    }

    return entities;
}

World.prototype.getEntitiesInAreaUnique = function(startX, startY, endX, endY) {
    const entities = [];

    if(!this.worldMap) {
        return entities;
    }

    const uniqueIndices = new Set();

    for(let i = startY; i < endY; i++) {
        for(let j = startX; j < endX; j++) {
            const index = this.worldMap.getEntity(j, i);

            if(!uniqueIndices.has(index)) {
                const entity = this.entityManager.getEntityByIndex(index); 

                if(entity) {
                    entities.push(entity);
                    uniqueIndices.add(index);
                }
            }
        }
    }

    return entities;
}

World.prototype.getEntitiesAround = function(tileX, tileY) {
    const entities = [];

    if(!this.worldMap) {
        return entities;
    }

    for(let i = 0; i < FloodFill.NEIGHBORS.length; i++) {
        const [deltaX, deltaY, type] = FloodFill.NEIGHBORS[i];
        const neighborX = deltaX + tileX;
        const neighborY = deltaY + tileY;
        const index = this.worldMap.getEntity(neighborX, neighborY);
        const entity = this.entityManager.getEntityByIndex(index);

        if(entity) {
            entities.push(entity);
        }
    }
    
    return entities;
}

World.prototype.getEntitiesAroundFull = function(tileX, tileY) {
    const entities = [];

    if(!this.worldMap) {
        return entities;
    }

    for(let i = 0; i < FloodFill.ALL_NEIGHBORS.length; i++) {
        const [deltaX, deltaY, type] = FloodFill.ALL_NEIGHBORS[i];
        const neighborX = deltaX + tileX;
        const neighborY = deltaY + tileY;
        const index = this.worldMap.getEntity(neighborX, neighborY);
        const entity = this.entityManager.getEntityByIndex(index);

        if(entity) {
            entities.push(entity);
        }
    }
    
    return entities;
}

World.prototype.getEntitiesInLine = function(tileX, tileY, deltaX, deltaY, maxSteps) {
    const entities = [];

    if(!this.worldMap) {
        return entities;
    }

    let currentX = tileX + deltaX;
    let currentY = tileY + deltaY;
    let step = 0;

    while(step < maxSteps && !this.worldMap.isTileOutOfBounds(currentX, currentY)) {
        const index = this.worldMap.getEntity(currentX, currentY);
        const entity = this.entityManager.getEntityByIndex(index);

        if(entity) {
            entities.push(entity);
        }

        currentX += deltaX;
        currentY += deltaY;
        step++;
    }

    return entities;
}