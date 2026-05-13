import { WorldMap } from "../../engine/map/worldMap.js";
import { FloodFill } from "../../engine/pathfinders/floodFill.js";
import { DIRECTION, ENTITY_CATEGORY, JAMMER_FLAG, PATH_FLAG, TRAIT_CONFIG, TRAIT_TYPE } from "../enums.js";
import { BattalionMap } from "../map/battalionMap.js";
import { EntityType } from "../type/parsed/entityType.js";
import { TileType } from "../type/parsed/tileType.js";

export const Interception = function() {
    this.isIntercepted = false;
    this.pathLength = 0;
}

Interception.prototype.reset = function() {
    this.isIntercepted = false;
    this.pathLength = 0;
}

Interception.prototype.intercept = function(pathLength) {
    this.isIntercepted = true;
    this.pathLength = pathLength;
}

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
    let currentNode = targetNode.parent;

    while(currentNode !== null && i < EntityType.MAX_MOVE_COST) {
        const { x, y, parent } = currentNode;
        const deltaX = lastX - x;
        const deltaY = lastY - y;

        path.unshift(fillStep(deltaX, deltaY));
        i++;
        lastX = x;
        lastY = y;
        currentNode = parent;
    }

    return path;
}

export const mGetNodeMap = function(gameContext, entity, nodeMap) {
    const { world } = gameContext;
    const { mapManager } = world;
    const { tileX, tileY, config } = entity;
    const { movementRange } = config;
    const worldMap = mapManager.getActiveMap();

    const startID = worldMap.getIndex(tileX, tileY);
    const startNode = createNode(startID, tileX, tileY, 0, null, null, PATH_FLAG.START);
    const queue = [startNode];
    const visitedCost = new Map();
    const typeCache = new Map();

    nodeMap.set(startID, startNode);
    visitedCost.set(startID, 0);

    while(queue.length > 0) {
        const node = mGetLowestCostNode(queue);
        const { cost, x, y } = node;

        if(cost > movementRange) {
            continue;
        }

        for(let i = 0; i < FloodFill.NEIGHBORS.length; i++) {
            const [deltaX, deltaY, type] = FloodFill.NEIGHBORS[i];
            const neighborX = x + deltaX;
            const neighborY = y + deltaY;
            const neighborID = worldMap.getIndex(neighborX, neighborY);

            if(neighborID === WorldMap.OUT_OF_BOUNDS) {
                continue;
            }

            let flags = PATH_FLAG.NONE;
            let tileType = typeCache.get(neighborID);

            if(!tileType) {
                tileType = worldMap.getTileType(gameContext, neighborX, neighborY);
                typeCache.set(neighborID, tileType);
            }

            const tileCost = cost + entity.getTileCost(gameContext, worldMap, tileType, neighborX, neighborY);

            if(tileCost <= movementRange) {
                const bestCost = visitedCost.get(neighborID);

                if(bestCost === undefined || tileCost < bestCost) {
                    const childNode = createNode(neighborID, neighborX, neighborY, tileCost, type, node, flags);

                    queue.push(childNode);
                    visitedCost.set(neighborID, tileCost);
                    nodeMap.set(neighborID, childNode);
                }
            } else if(!nodeMap.has(neighborID)) {
                //Hacky but possible because every node has a minimum cost of 1.
                flags |= PATH_FLAG.UNREACHABLE;

                const childNode = createNode(neighborID, neighborX, neighborY, tileCost, type, node, flags);

                nodeMap.set(neighborID, childNode);
            }
        }
    }

    console.log(nodeMap);
}