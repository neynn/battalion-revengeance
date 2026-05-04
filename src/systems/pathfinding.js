import { DIRECTION, ENTITY_CATEGORY, JAMMER_FLAG, PATH_FLAG, TRAIT_CONFIG, TRAIT_TYPE } from "../enums.js";
import { BattalionMap } from "../map/battalionMap.js";
import { EntityType } from "../type/parsed/entityType.js";
import { TileType } from "../type/parsed/tileType.js";

/**
 * 
 * @param {*} gameContext 
 * @param {TileType} tileType 
 * @param {EntityType} entityType 
 * @returns {number}
 * 
 * Returns a number between MIN_MOVE_COST and MAX_MOVE_COST.
 */
export const getEntityTypeTileCost = function(gameContext, tileType, entityType) {
    const { typeRegistry } = gameContext;
    const { terrain } = tileType;
    const { movementType } = entityType;
    let tileCost = tileType.getPassabilityCost(movementType);

    //Prevents infinite/looping steps.
    //Also negative costs block entities from walking over them.
    if(tileCost <= 0) {
        return EntityType.MAX_MOVE_COST;
    }
    
    const terrainReduction = entityType.hasTrait(TRAIT_TYPE.STREAMLINED) ? TRAIT_CONFIG.STREAMLINED_REDUCTION : 1;

    for(const terrainID of terrain) {
        const terrainType = typeRegistry.getTerrainType(terrainID);
        const cost = terrainType.getCost(movementType);

        //Some terrains may disable entities from walking over them.
        if(cost < 0) {
            return EntityType.MAX_MOVE_COST;
        }

        tileCost += (cost * terrainReduction);
    }

    if(tileCost > EntityType.MAX_MOVE_COST) {
        tileCost = EntityType.MAX_MOVE_COST;
    } else if(tileCost < EntityType.MIN_MOVE_COST) {
        tileCost = EntityType.MIN_MOVE_COST;
    }
    
    return tileCost;
}

/**
 * 
 * @param {*} gameContext 
 * @param {EntityType} entityType 
 * @param {BattalionMap} worldMap 
 * @param {number} tileX 
 * @param {number} tileY 
 * @param {number} teamID 
 * @returns 
 */
export const isEntityTypeJammed = function(gameContext, entityType, worldMap, tileX, tileY, teamID) {
    const { category } = entityType;

    //Airspace is blocked by a jammer.
    //Units with HIGH_ALTITUDE may fly regardless.
    if(category === ENTITY_CATEGORY.AIR && !entityType.hasTrait(TRAIT_TYPE.HIGH_ALTITUDE)) {
        return worldMap.isJammed(gameContext, tileX, tileY, teamID, JAMMER_FLAG.AIRSPACE_BLOCKED);
    }

    return false;
}

/**
 * 
 * @param {*} gameContext 
 * @param {number} typeID 
 * @param {number} tileX 
 * @param {number} tileY 
 * @param {number} teamID 
 * @returns {boolean}
 * 
 * Only for moving entities.
 */
export const canEntityTypeStandOnTile = function(gameContext, typeID, tileX, tileY, teamID) {
    const { typeRegistry, world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const tileType = worldMap.getTileType(gameContext, tileX, tileY);
    const entityType = typeRegistry.getEntityType(typeID);
    const tileCost = getEntityTypeTileCost(gameContext, tileType, entityType);

    if(tileCost > entityType.movementRange) {
        return false;
    }

    return !isEntityTypeJammed(gameContext, entityType, worldMap, tileX, tileY, teamID);
}

export const mGetLowestCostNode = function(queue) {
    let lowestNode = queue[0];
    let lowestIndex = 0;

    for(let i = 1; i < queue.length; i++) {
        if(queue[i].cost < queue[lowestIndex].cost) {
            lowestNode = queue[i];
            lowestIndex = i;
        }
    }

    queue[lowestIndex] = queue[queue.length - 1];
    queue.pop();

    return lowestNode;
}

export const createNode = function(id, x, y, cost, type, parent, flags) {
    return {
        "id": id,
        "x": x,
        "y": y,
        "cost": cost,
        "type": type,
        "parent": parent,
        "flags": flags
    }
}

export const createStep = function() {
    return {
        "deltaX": 0,
        "deltaY": 0
    }
}

export const fillStep = function(deltaX, deltaY) {
    const step = createStep();

    step.deltaX = deltaX;
    step.deltaY = deltaY;

    return step;
}

export const directionToStep = function(direction) {
    const step = createStep();

    switch(direction) {
        case DIRECTION.NORTH: {
            step.deltaX = 0;
            step.deltaY = -1;
            break;
        }
        case DIRECTION.EAST: {
            step.deltaX = 1;
            step.deltaY = 0;
            break;
        }
        case DIRECTION.SOUTH: {
            step.deltaX = 0;
            step.deltaY = 1
            break;
        }
        case DIRECTION.WEST: {
            step.deltaX = -1;
            step.deltaY = 0;
            break;
        }
    }

    return step;
}

export const isNodeReachable = function(node) {
    const { flags } = node;

    if(flags & PATH_FLAG.UNREACHABLE) {
        return false;
    }

    return true;
}

export const getBestPath = function(gameContext, nodes, targetX, targetY) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const path = [];

    if(!worldMap) {
        return path;
    }

    const index = worldMap.getIndex(targetX, targetY);
    const targetNode = nodes.get(index);

    if(!targetNode || !isNodeReachable(targetNode)) {
        return path;
    }

    let i = 0;
    let lastX = targetX;
    let lastY = targetY;
    let currentNode = nodes.get(targetNode.parent);

    while(currentNode !== undefined && i < EntityType.MAX_MOVE_COST) {
        const { x, y, parent } = currentNode;
        const deltaX = lastX - x;
        const deltaY = lastY - y;

        path.push(fillStep(deltaX, deltaY));

        i++;
        lastX = x;
        lastY = y;
        currentNode = nodes.get(parent);
    }

    return path;
}