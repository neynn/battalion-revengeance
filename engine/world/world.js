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

    const entityID = worldMap.getTopEntity(tileX, tileY);
    const entity = this.entityManager.getEntity(entityID);

    return entity;
}

World.prototype.getEntitiesInArea = function(startX, startY, endX, endY) {
    const worldMap = this.mapManager.getActiveMap();
    const entities = [];

    if(!worldMap) {
        return entities;
    }

    for(let i = startY; i < endY; i++) {
        for(let j = startX; j < endX; j++) {
            const entityID = worldMap.getTopEntity(j, i);
            const entity = this.entityManager.getEntity(entityID);

            if(entity) {
                entities.push(entity);
            }
        }
    }

    return entities;
}

World.prototype.getUniqueEntitiesInArea = function(startX, startY, endX, endY) {
    const worldMap = this.mapManager.getActiveMap();
    const entities = [];

    if(!worldMap) {
        return entities;
    }

    const uniquedIDs = new Set();

    for(let i = startY; i < endY; i++) {
        for(let j = startX; j < endX; j++) {
            const entityID = worldMap.getTopEntity(j, i);

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
        const entityID = worldMap.getTopEntity(neighborX, neighborY);
        const entity = this.entityManager.getEntity(entityID);

        if(entity) {
            entities.push(entity);
        }
    }
    
    return entities;
}