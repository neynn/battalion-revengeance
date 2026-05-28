import { MAX_TILE_COLUMNS, MAX_TILE_ROWS } from "../../engine/engine_constants.js";
import { WorldMap } from "../../engine/map/worldMap.js";
import { FloodFill } from "../../engine/pathfinders/floodFill.js";
import { BattalionEntity } from "../entity/battalionEntity.js";
import { DIRECTION, ENTITY_CATEGORY, JAMMER_FLAG, MOVEMENT_TYPE, PATH_FLAG, RANGE_TYPE, TILE_ID, TILE_TYPE, TRAIT_CONFIG, TRAIT_TYPE } from "../enums.js";
import { BattalionMap } from "../map/battalionMap.js";
import { EntityType } from "../type/parsed/entityType.js";
import { TileType } from "../type/parsed/tileType.js";
import { CombatSystem } from "./combat.js";
import { fillStep } from "./direction.js";

/**
 * 
 * @param {*} gameContext 
 * @param {TileType} tileType 
 * @param {EntityType} entityType 
 * @returns {number}
 * 
 * Returns a number between MIN_MOVE_COST and MAX_MOVE_COST.
 */
const getEntityTypeTileCost = function(gameContext, tileType, entityType) {
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
 * @returns {boolean}
 */
const isEntityTypeJammed = function(gameContext, entityType, worldMap, tileX, tileY, teamID) {
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

const createNode = function(id, x, y, cost, type, parent, flags) {
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

const mGetLowestCostNode = function(queue) {
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

/**
 * 
 * @param {*} gameContext 
 * @param {BattalionMap} worldMap 
 * @param {BattalionEntity} entity 
 * @param {TileType} tileType 
 * @param {number} tileX 
 * @param {number} tileY 
 * @returns 
 */
const resolveTileCost = function(gameContext, worldMap, entity, tileType, tileX, tileY) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { config, teamID } = entity;
    const { movementType } = config;
    const tileCost = getEntityTypeTileCost(gameContext, tileType, config);

    if(tileCost >= EntityType.MAX_MOVE_COST) {
        return EntityType.MAX_MOVE_COST;
    }

    if(isEntityTypeJammed(gameContext, config, worldMap, tileX, tileY, teamID)) {
        return EntityType.MAX_MOVE_COST;
    }

    const index = worldMap.getEntity(tileX, tileY);
    const otherEntity = entityManager.getEntityByIndex(index);
    
    if(!otherEntity) {
        return tileCost;
    }

    //Trains are always blocked if an entity is on rail, no matter the type.
    //On the contrary, trains can move really fast.
    if(movementType === MOVEMENT_TYPE.RAIL && tileType.id === TILE_TYPE.RAIL) {
        //Always block on allied units and VISIBLE enemy units.
        //Invisible enemy units get ignored.
        if(entity.isAllyWith(gameContext, otherEntity) || !otherEntity.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
            return EntityType.MAX_MOVE_COST;
        }
    }

    //Blocks on non-cloaked enemy units. Ignores cloaked enemy units and treats them as walkable.
    if(!entity.isAllyWith(gameContext, otherEntity) && !otherEntity.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
        return EntityType.MAX_MOVE_COST;
    }

    const mine = worldMap.getMine(tileX, tileY);

    //We could always assume that an enemy mine is visible if an entity is on it, but safety first.
    //Ally on tile but !isHidden && mine is an impossible state.
    //This prevents entities from passing over a visible mine that they will trigger when an ally stands on it.
    if(mine) {
        if(!mine.isHidden() && CombatSystem.isMineTriggered(gameContext, entity, mine)) {
            return EntityType.MAX_MOVE_COST;
        }
    }

    return tileCost;
}

export const Pathfinder = function(width, height) {
    this.width = width;
    this.height = height;
    this.size = width * height;
    this.costs = new Float16Array(this.size);
    this.parents = new Int32Array(this.size);
    this.visited = new Uint32Array(this.size);
    this.flags = new Uint8Array(this.size);
    this.tile = new Uint16Array(this.size);
    this.heap = [];
    this.searchID = 1;
}

Pathfinder.prototype.reset = function() {
    this.visited.fill(0);
    this.searchID = 1;
}

Pathfinder.prototype.beginSearch = function() {
    this.searchID++;
    this.heap.length = 0;
}

Pathfinder.prototype.mGetLowestCostNode = function() {
    return mGetLowestCostNode(this.heap);
}

/**
 * 
 * @param {*} gameContext 
 * @param {BattalionEntity} entity 
 * @returns 
 */
Pathfinder.prototype.computeMovement = function(gameContext, entity) {
    const { world } = gameContext;
    const { mapManager } = world;
    const { tileX, tileY, config } = entity;
    const { movementRange, minRange } = config;
    const rangeType = entity.getRangeType();
    const hasWeapon = entity.hasWeapon();
    const maxRange = entity.getMaxRange(gameContext);

    const worldMap = mapManager.getActiveMap();
    const startID = worldMap.getIndex(tileX, tileY);

    this.beginSearch();
    this.costs[startID] = 0;
    this.parents[startID] = -1;
    this.visited[startID] = this.searchID;
    this.flags[startID] = PATH_FLAG.NONE;

    this.heap.push({
        "id": startID,
        "cost": 0
    });

    while(this.heap.length > 0) {
        const { id, cost } = this.mGetLowestCostNode();

        if(cost > movementRange) {
            continue;
        }

        const x = id % worldMap.width;
        const y = Math.floor((id / worldMap.width));

        for(const [deltaX, deltaY] of FloodFill.NEIGHBORS) {
            const neighborX = x + deltaX;
            const neighborY = y + deltaY;
            const neighborID = worldMap.getIndex(neighborX, neighborY);

            if(neighborID === WorldMap.OUT_OF_BOUNDS) {
                continue;
            }

            const tileType = worldMap.getTileType(gameContext, neighborX, neighborY);
            const moveCost = resolveTileCost(gameContext, worldMap, entity, tileType, neighborX, neighborY);
            const newCost = cost + moveCost;
        
            if(newCost <= movementRange) {
                if(this.visited[neighborID] !== this.searchID || newCost < this.costs[neighborID]) {
                    this.costs[neighborID] = newCost;
                    this.parents[neighborID] = id;
                    this.visited[neighborID] = this.searchID;
                    this.flags[neighborID] = PATH_FLAG.NONE;
                    this.tile[neighborID] = TILE_ID.NONE;

                    this.heap.push({
                        "id": neighborID,
                        "cost": newCost
                    });

                    switch(rangeType) {
                        case RANGE_TYPE.MELEE: {
                            this.tile[neighborID] = TILE_ID.OVERLAY_MOVE;
                            break;
                        }
                        case RANGE_TYPE.HYBRID:
                        case RANGE_TYPE.RANGE: {
                            const distance = Math.abs(neighborX - tileX) + Math.abs(neighborY - tileY);

                            if(distance >= minRange && distance <= maxRange) {
                                this.tile[neighborID] = TILE_ID.OVERLAY_MOVE_ATTACK;
                            } else {
                                this.tile[neighborID] = TILE_ID.OVERLAY_MOVE;
                            }

                            break;
                        }
                    }
                } 
            } else if(this.visited[neighborID] !== this.searchID) {
                this.visited[neighborID] = this.searchID;
                this.flags[neighborID] |= PATH_FLAG.UNREACHABLE;
                this.tile[neighborID] = TILE_ID.NONE;

                switch(rangeType) {
                    case RANGE_TYPE.MELEE: {
                        if(hasWeapon) {
                            this.tile[neighborID] = TILE_ID.OVERLAY_ATTACK_LIGHT;
                        }

                        break;
                    }
                    case RANGE_TYPE.HYBRID:
                    case RANGE_TYPE.RANGE: {
                        const distance = Math.abs(neighborX - tileX) + Math.abs(neighborY - tileY);

                        if(distance >= minRange && distance <= maxRange) {
                            this.tile[neighborID] = TILE_ID.OVERLAY_ATTACK_LIGHT;
                        }

                        break;
                    }
                }
            }
        }
    }

    this.tile[startID] = TILE_ID.OVERLAY_MOVE;
    this.flags[startID] = PATH_FLAG.START;
    this.heap.length = 0;
}

Pathfinder.prototype.addRangedOverlay = function(gameContext, entity) {
    const { world } = gameContext;
    const { mapManager } = world;
    const { tileX, tileY, config } = entity;
    const { minRange } = config;
    const rangeType = entity.getRangeType();
    const maxRange = entity.getMaxRange(gameContext);

    //Fill the rest out to signal attack range.
    if(rangeType === RANGE_TYPE.HYBRID || rangeType === RANGE_TYPE.RANGE) {
        const worldMap = mapManager.getActiveMap();

        worldMap.fill2DGraph(tileX, tileY, maxRange, (nextX, nextY, distance, index) => {
            if(distance >= minRange && this.visited[index] !== this.searchID) {
                this.visited[index] = this.searchID;
                this.flags[index] = PATH_FLAG.UNREACHABLE;
                this.tile[index] = TILE_ID.OVERLAY_ATTACK;
            }
        });
    }
}


const pathfinder = new Pathfinder(MAX_TILE_COLUMNS, MAX_TILE_ROWS);

export const PathfinderSystem = {
    pathfinder: pathfinder,
    isNodeReachable: function(index) {
        if(index === WorldMap.OUT_OF_BOUNDS || index >= pathfinder.size) {
            return false;
        }

        const flags = pathfinder.flags[index];

        if(flags & PATH_FLAG.UNREACHABLE) {
            return false;
        }

        const generation = pathfinder.visited[index];

        if(generation !== pathfinder.searchID) {
            return false;
        }

        return true;
    },
    getCostOf: function(index) {
        if(index === WorldMap.OUT_OF_BOUNDS || index >= pathfinder.size) {
            return EntityType.MAX_MOVE_COST;
        }

        const flags = pathfinder.flags[index];

        if(flags & PATH_FLAG.UNREACHABLE) {
            return EntityType.MAX_MOVE_COST;
        }

        const generation = pathfinder.visited[index];

        if(generation !== pathfinder.searchID) {
            return EntityType.MAX_MOVE_COST;
        }

        return pathfinder.costs[index];    
    },
    isPathWalkable: function(gameContext, entity, path) {
        const { world } = gameContext;
        const { mapManager } = world;
        const worldMap = mapManager.getActiveMap();

        const { tileX, tileY, config } = entity;
        const { movementRange } = config;

        let nextX = tileX;
        let nextY = tileY;
        let totalCost = 0;

        //Path[path.length -1] is the target.
        for(let i = 0; i < path.length; i++) {
            const { deltaX, deltaY } = path[i];
            const totalDelta = Math.abs(deltaX) + Math.abs(deltaY);

            //Entities can only move one tile at a time.
            if(totalDelta > 1) {
                return false;
            }

            nextX += deltaX;
            nextY += deltaY;

            const index = worldMap.getIndex(nextX, nextY);

            //The target is out of bounds
            if(index === WorldMap.OUT_OF_BOUNDS) {
                return false;
            }

            const tileType = worldMap.getTileType(gameContext, nextX, nextY);

            totalCost += resolveTileCost(gameContext, worldMap, entity, tileType, nextX, nextY);

            if(totalCost > movementRange) {
                return false;
            }
        }

        return true;
    },
    getBestPath: function(gameContext, targetX, targetY) {
        const { world } = gameContext;
        const { mapManager } = world;
        const worldMap = mapManager.getActiveMap();
        const path = [];

        if(!worldMap) {
            return path;
        }

        const index = worldMap.getIndex(targetX, targetY);

        if(index === WorldMap.OUT_OF_BOUNDS) {
            return path;
        }

        const parent = pathfinder.parents[index];
        const flags = pathfinder.flags[index];

        if(flags & PATH_FLAG.UNREACHABLE) {
            return path;
        }

        let i = 0;
        let lastX = targetX;
        let lastY = targetY;
        let currentIndex = parent;

        while(currentIndex !== -1 && pathfinder.visited[currentIndex] === pathfinder.searchID && i < EntityType.MAX_MOVE_COST) {
            const { x, y } = worldMap.getTileCoords(currentIndex);
            const deltaX = lastX - x;
            const deltaY = lastY - y;

            path.unshift(fillStep(deltaX, deltaY));
            i++;
            lastX = x;
            lastY = y;
            currentIndex = pathfinder.parents[currentIndex];
        }

        return path;
    }
};

/**
 * 
 * @param {boolean} isIntercepted 
 * @param {number} pathLength 
 * @returns 
 */
const createInterception = function(isIntercepted, pathLength) {
    return {
        "isIntercepted": isIntercepted,
        "pathLength": pathLength
    }
}

export const InterceptSystem = {
    mInterceptEntity: function(gameContext, entity, path, pathLength) {
        const { world } = gameContext;
        const { tileX, tileY, teamID } = entity;
        const interception = createInterception(false, pathLength);
        
        let nextX = tileX;
        let nextY = tileY;
        let lastEmptyIndex = -1;

        for(let i = 0; i < pathLength; i++) {
            const { deltaX, deltaY } = path[i];

            nextX += deltaX;
            nextY += deltaY;

            const nextEntity = world.getEntityAt(nextX, nextY);

            if(!nextEntity) {
                lastEmptyIndex = i;
            } else if(!nextEntity.isVisibleTo(gameContext, teamID)) {
                //If the entity has passed through an entity before.
                //This is a defensive check to enforce the 1-gap-stealth rule between entities. 
                if(lastEmptyIndex !== i - 1) {
                    interception.pathLength = 0;
                    break;
                }

                //i means ending NEXT TO the invisible entity.
                interception.isIntercepted = true;
                interception.pathLength = i;
                break;
            }
        }

        return interception;
    },
    mInterceptMine: function(gameContext, entity, path, pathLength) {
        const { world } = gameContext;
        const { mapManager } = world;
        const worldMap = mapManager.getActiveMap();
        const { tileX, tileY } = entity;
        const interception = createInterception(false, pathLength);

        let nextX = tileX;
        let nextY = tileY;

        for(let i = 0; i < pathLength; i++) {
            const { deltaX, deltaY } = path[i];

            nextX += deltaX;
            nextY += deltaY;

            const mine = worldMap.getMine(nextX, nextY);

            if(mine && CombatSystem.isMineTriggered(gameContext, entity, mine)) {
                //i + 1 means ending ON the mine tile.
                interception.isIntercepted = true;
                interception.pathLength = i + 1;
                break;
            }
        }

        return interception;
    }
};