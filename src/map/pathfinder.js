import { WorldMap } from "../../engine/map/worldMap.js";
import { FloodFill } from "../../engine/pathfinders/floodFill.js";
import { PATH_FLAG, RANGE_TYPE, TILE_ID } from "../enums.js";
import { fillStep } from "../systems/direction.js";
import { resolveTileCost } from "../systems/pathfinder.js";
import { EntityType } from "../type/parsed/entityType.js";

export const Pathfinder = function(width, height) {
    this.width = width;
    this.height = height;
    this.size = width * height;
    this.costs = new Float16Array(this.size);
    this.parents = new Int32Array(this.size);
    this.visited = new Uint16Array(this.size);
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

    if(this.searchID > 0xffff) {
        this.reset();
    }
}

Pathfinder.prototype.mGetLowestCostNode = function() {
    let lowestNode = this.heap[0];
    let lowestIndex = 0;

    for(let i = 1; i < this.heap.length; i++) {
        if(this.heap[i].cost < this.heap[lowestIndex].cost) {
            lowestNode = this.heap[i];
            lowestIndex = i;
        }
    }

    this.heap[lowestIndex] = this.heap[this.heap.length - 1];
    this.heap.pop();

    return lowestNode;
}

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

Pathfinder.prototype.isNodeReachable = function(index) {
    if(index < 0 || index >= this.size) {
        return false;
    }

    if(this.flags[index] & PATH_FLAG.UNREACHABLE) {
        return false;
    }

    if(this.visited[index] !== this.searchID) {
        return false;
    }

    return true;
}

Pathfinder.prototype.getCostOf = function(index) {
    if(index < 0 || index >= this.size) {
        return EntityType.MAX_MOVE_COST;
    }

    if(this.flags[index] & PATH_FLAG.UNREACHABLE) {
        return EntityType.MAX_MOVE_COST;
    }

    if(this.visited[index] !== this.searchID) {
        return EntityType.MAX_MOVE_COST;
    }

    return this.costs[index];    
}

Pathfinder.prototype.getBestPath = function(worldMap, targetX, targetY) {
    const path = [];
    const index = worldMap.getIndex(targetX, targetY);

    if(index < 0 || index >= this.size) {
        return path;
    }

    if(this.flags[index] & PATH_FLAG.UNREACHABLE) {
        return path;
    }

    let i = 0;
    let lastX = targetX;
    let lastY = targetY;
    let currentIndex = this.parents[index];

    while(currentIndex !== -1 && this.visited[currentIndex] === this.searchID && i < EntityType.MAX_MOVE_COST) {
        const { x, y } = worldMap.getTileCoords(currentIndex);
        const deltaX = lastX - x;
        const deltaY = lastY - y;

        path.unshift(fillStep(deltaX, deltaY));
        i++;
        lastX = x;
        lastY = y;
        currentIndex = this.parents[currentIndex];
    }

    return path;
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