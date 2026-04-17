import { Entity } from "../../engine/entity/entity.js";
import { EntityManager } from "../../engine/entity/entityManager.js";
import { WorldMap } from "../../engine/map/worldMap.js";
import { isRectangleRectangleIntersect } from "../../engine/math/math.js";
import { FloodFill } from "../../engine/pathfinders/floodFill.js";
import { EntityType } from "../type/parsed/entityType.js";
import { createNode, mGetLowestCostNode } from "../systems/pathfinding.js";
import { getDirectionByDelta, getDirectionVector } from "../systems/direction.js";
import { TRAIT_CONFIG, ATTACK_TYPE, DIRECTION, PATH_FLAG, RANGE_TYPE, ATTACK_FLAG, MORALE_TYPE, WEAPON_TYPE, MOVEMENT_TYPE, TRAIT_TYPE, ENTITY_CATEGORY, JAMMER_FLAG, ENTITY_TYPE, TILE_TYPE, PATH_INTERCEPT } from "../enums.js";
import { mapTransportToEntity } from "../enumHelpers.js";
import { getLineEntities } from "../systems/targeting.js";
import { TeamManager } from "../team/teamManager.js";
import { createEntitySnapshot } from "../snapshot/entitySnapshot.js";
import { LanguageHandler } from "../../engine/language/languageHandler.js";
import { BattalionMap } from "../map/battalionMap.js";

const MORALE_DELTA_MAX = 3;
const MORALE_DELTA_MIN = -3;

export const BattalionEntity = function(id) {
    Entity.call(this, id);

    this.config = null;
    this.customID = BattalionMap.INVALID_CUSTOM_ID;
    this.customName = LanguageHandler.INVALID_ID;
    this.customDesc = LanguageHandler.INVALID_ID;
    this.health = 1;
    this.maxHealth = 1;
    this.damage = 0;
    this.moraleType = MORALE_TYPE.NORMAL;
    this.moraleDelta = 0;
    this.tileX = -1;
    this.tileY = -1;
    this.tileZ = -1;
    this.direction = DIRECTION.EAST;
    this.state = BattalionEntity.STATE.IDLE;
    this.teamID = TeamManager.INVALID_ID;
    this.transportID = ENTITY_TYPE._INVALID;
    this.lastAttacker = EntityManager.INVALID_ID;
    this.turns = 0;
    this.cash = 0;
    this.opacity = 1;
}

BattalionEntity.FLAG = {
    NONE: 0,
    IS_CLOAKED: 1 << 0,
    IS_SUBMERGED: 1 << 1,
    HAS_MOVED: 1 << 2,
    HAS_ACTED: 1 << 3,
    CAN_MOVE: 1 << 4,
    CAN_ACT: 1 << 5,
    BEWEGUNGSKRIEG_TRIGGERED: 1 << 7,
    ELUSIVE_TRIGGERED: 1 << 8,
    IS_TURN: 1 << 9,
    IS_PROTECTED: 1 << 10
};

BattalionEntity.STATE = {
    IDLE: 0,
    MOVE: 1,
    FIRE: 2,
    DEAD: 3
};

BattalionEntity.prototype = Object.create(Entity.prototype);
BattalionEntity.prototype.constructor = BattalionEntity;

BattalionEntity.prototype.save = function() {
    const snapshot = createEntitySnapshot();

    snapshot.type = this.config.id;
    snapshot.flags = this.flags;
    snapshot.health = this.health;
    snapshot.maxHealth = this.maxHealth;
    snapshot.morale = this.moraleType;
    snapshot.moraleDelta = this.moraleDelta;
    snapshot.tileX = this.tileX;
    snapshot.tileY = this.tileY;
    snapshot.tileZ = this.tileZ;
    snapshot.teamID = this.teamID;
    snapshot.transport = this.transportID;
    snapshot.direction = this.direction;
    snapshot.state = this.state;
    snapshot.turns = this.turns;
    snapshot.cash = this.cash;
    snapshot.id = this.customID;
    snapshot.name = this.customName;
    snapshot.desc = this.customDesc;

    return snapshot;
}

BattalionEntity.prototype.load = function(data) {
    this.flags = data.flags;
    this.maxHealth = data.maxHealth;
    this.moraleType = data.morale;
    this.tileZ = data.tileZ;
    this.transportID = data.transport;
    this.state = data.state;
    this.turns = data.turns;
    this.cash = data.cash;
    this.customID = data.id;
    this.customName = data.name;
    this.customDesc = data.desc;
    this.setDirection(data.direction);
    this.setHealth(data.health);
}

BattalionEntity.prototype.loadConfig = function(config) {
    const { health, damage } = config;

    this.config = config;
    this.health = health;
    this.maxHealth = health;
    this.damage = damage;

    this.setHealth(this.health);
}

BattalionEntity.prototype.setState = function(stateID) {
    this.state = stateID;
}

BattalionEntity.prototype.belongsTo = function(teamID) {
    return this.teamID !== TeamManager.INVALID_ID && this.teamID === teamID;
}

BattalionEntity.prototype.getVitality = function() {
    return this.health / this.maxHealth;
}

BattalionEntity.prototype.getTeam = function(gameContext) {
    const { teamManager } = gameContext;
    
    return teamManager.getTeam(this.teamID);
}

BattalionEntity.prototype.getRangeType = function() {
    return this.config.rangeType;
}

BattalionEntity.prototype.getAttackType = function() {
    return this.config.getAttackType();
}

BattalionEntity.prototype.isRangeValid = function(gameContext, entity) {
    const distance = this.getDistanceToEntity(entity);

    if(distance < this.config.minRange) {
        return false;
    }

    return distance <= this.getMaxRange(gameContext);
}

BattalionEntity.prototype.isAtFullHealth = function() {
    return this.health >= this.maxHealth;
}

BattalionEntity.prototype.getHealthAfterHeal = function(heal = 0) {
    const health = Math.floor(this.health + heal);

    if(health <= 0) {
        return 0;
    }

    if(health >= this.maxHealth) {
        return this.maxHealth;
    }

    return health;
}

BattalionEntity.prototype.getClampedHealth = function(health = 0) {
    if(health <= 0) {
        return 0;
    }

    if(health >= this.maxHealth) {
        return this.maxHealth;
    }

    return health;
}

BattalionEntity.prototype.getHealthAfterAttack = function(damage = 0) {
    const health = Math.floor(this.health - damage);

    if(health <= 0) {
        if(this.health > TRAIT_CONFIG.HEROIC_THRESHOLD && this.hasTrait(TRAIT_TYPE.HEROIC)) {
            return TRAIT_CONFIG.HEROIC_THRESHOLD;
        }

        return 0;
    }

    return health;
}

BattalionEntity.prototype.setHealth = function(health) {
    if(health < 0) {
        this.health = 0;
    } else {
        this.health = health;
    }
}

BattalionEntity.prototype.hasTrait = function(traitID) {
    return this.config.hasTrait(traitID);
}

BattalionEntity.prototype.updateTile = function(deltaX, deltaY) {
    this.tileX += deltaX;
    this.tileY += deltaY;
}

BattalionEntity.prototype.setTile = function(tileX, tileY) {
    this.tileX = tileX;
    this.tileY = tileY;
}

BattalionEntity.prototype.setDirection = function(direction) {
    if(this.direction === direction) {
        return false;
    }

    if(Object.values(DIRECTION).includes(direction)) {
        this.direction = direction;

        return true;
    }

    return false;
}

BattalionEntity.prototype.setDirectionByDelta = function(deltaX, deltaY) {
    const direction = getDirectionByDelta(deltaX, deltaY);

    return this.setDirection(direction);
}

BattalionEntity.prototype.getDirectionToTile = function(tileX, tileY) {
    const deltaX = tileX - this.tileX;
    const deltaY = tileY - this.tileY;
    const distanceX = Math.abs(deltaX);
    const distanceY = Math.abs(deltaY);

    if(distanceX > distanceY) {
        return getDirectionByDelta(deltaX, 0);
    } else {
        return getDirectionByDelta(0, deltaY);
    }
}

BattalionEntity.prototype.getDirectionTo = function(entity) {
    const deltaX = entity.tileX - this.tileX;
    const deltaY = entity.tileY - this.tileY;
    const distanceX = Math.abs(deltaX);
    const distanceY = Math.abs(deltaY);

    if(distanceX > distanceY) {
        return getDirectionByDelta(deltaX, 0);
    } else {
        return getDirectionByDelta(0, deltaY);
    }
}

BattalionEntity.prototype.getTileByDirection = function(direction) {
    const vec = getDirectionVector(direction);

    vec.x += this.tileX;
    vec.y += this.tileY;

    return vec;
}

BattalionEntity.prototype.addCash = function(value) {
    this.cash += value;
}

BattalionEntity.prototype.lookAt = function(entity) {
    const direction = this.getDirectionTo(entity);

    return this.setDirection(direction);
}

BattalionEntity.prototype.setTeam = function(teamID) {
    this.teamID = teamID;
}

BattalionEntity.prototype.getMorale = function(gameContext) {
    const { typeRegistry } = gameContext;
    let morale = this.moraleType + this.moraleDelta;

    if(morale < MORALE_TYPE.LOWEST)  {
        morale = MORALE_TYPE.LOWEST;
    } else if(morale > MORALE_TYPE.HIGHEST) {
        morale = MORALE_TYPE.HIGHEST;
    }

    return typeRegistry.getMoraleType(morale);
}

BattalionEntity.prototype.applyTerrifying = function() {
    this.moraleDelta--;

    if(this.moraleDelta < MORALE_DELTA_MIN) {
        this.moraleDelta = MORALE_DELTA_MIN;
    }
}

BattalionEntity.prototype.applyInflaming = function() {
    this.moraleDelta++;

    if(this.moraleDelta > MORALE_DELTA_MAX) {
        this.moraleDelta = MORALE_DELTA_MAX;
    }
}

BattalionEntity.prototype.occupiesTile = function(tileX, tileY) {
    return isRectangleRectangleIntersect(tileX, tileY, 1, 1, this.tileX, this.tileY, this.config.dimX, this.config.dimY);
}

BattalionEntity.prototype.isColliding = function(target, range = 0) {
    return isRectangleRectangleIntersect(
        this.tileX - range,
        this.tileY - range,
        this.config.dimX - 1 + range * 2,
        this.config.dimY - 1 + range * 2,
        target.tileX,
        target.tileY,
        target.config.dimX - 1,
        target.config.dimY - 1
    );;
}

BattalionEntity.prototype.isDead = function() {
    return this.health <= 0 || this.isMarkedForDestroy;
}

BattalionEntity.prototype.isAllyWith = function(gameContext, entity) {
    const { teamManager } = gameContext;
    const { teamID } = entity;

    return teamManager.isAlly(this.teamID, teamID);
}

BattalionEntity.prototype.getTerrainDamage = function(gameContext) {
    //Commandos take NO damage from terrains.
    //Entities also do not take damage their first turn.
    if(this.turns <= 0 || this.hasTrait(TRAIT_TYPE.COMMANDO)) {
        return 0;
    }

    const { world, typeRegistry } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    const startX = this.tileX;
    const startY = this.tileY;
    const endX = startX + this.config.dimX;
    const endY = startY + this.config.dimY;
    let totalDamage = 0;

    for(let i = startY; i < endY; i++) {
        for(let j = startX; j < endX; j++) {
            const { terrain } = worldMap.getTileType(gameContext, j, i);

            for(const terrainID of terrain) {
                const terrainType = typeRegistry.getTerrainType(terrainID);

                totalDamage += terrainType.getDamage(this.config.movementType);
            }
        }
    }

    return Math.floor(totalDamage);
}

BattalionEntity.prototype.getTileCost = function(gameContext, worldMap, tileType, tileX, tileY) {
    const { world, typeRegistry } = gameContext;
    const { entityManager } = world;
    const { terrain } = tileType;
    let tileCost = tileType.getPassabilityCost(this.config.movementType);

    //Prevents infinite/looping steps.
    if(tileCost <= 0) {
        return EntityType.MAX_MOVE_COST;
    }

    //Airspace is blocked by a jammer.
    //Units with HIGH_ALTITUDE may fly regardless.
    if(this.config.category === ENTITY_CATEGORY.AIR && !this.hasTrait(TRAIT_TYPE.HIGH_ALTITUDE)) {
        if(worldMap.isJammed(gameContext, tileX, tileY, this.teamID, JAMMER_FLAG.AIRSPACE_BLOCKED)) {
            return EntityType.MAX_MOVE_COST;
        }
    }
    
    const terrainReduction = this.hasTrait(TRAIT_TYPE.STREAMLINED) ? TRAIT_CONFIG.STREAMLINED_REDUCTION : 1;
    
    for(let i = 0; i < terrain.length; i++) {
        const terrainType = typeRegistry.getTerrainType(terrain[i]);
        const cost = terrainType.getCost(this.config.movementType);

        //Some terrains may disable entities from walking over them.
        if(cost < 0) {
            return EntityType.MAX_MOVE_COST;
        }

        tileCost += (cost * terrainReduction);
    }

    const index = worldMap.getEntity(tileX, tileY);
    const entity = entityManager.getEntityByIndex(index);
    
    if(entity) {
        //Trains are always blocked if an entity is on rail, no matter the type.
        //On the contrary, trains can move really fast.
        if(this.config.movementType === MOVEMENT_TYPE.RAIL && tileType.id === TILE_TYPE.RAIL) {
            //Always block on allied units and VISIBLE enemy units.
            //Invisible enemy units get ignored.
            if(this.isAllyWith(gameContext, entity) || !entity.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
                return EntityType.MAX_MOVE_COST;
            }
        }

        //Blocks on non-cloaked enemy units. Ignores cloaked enemy units and treats them as walkable.
        if(!this.isAllyWith(gameContext, entity) && !entity.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
            return EntityType.MAX_MOVE_COST;
        }

        const mine = worldMap.getMine(tileX, tileY);

        //We could always assume that an enemy mine is visible if an entity is on it, but safety first.
        //Ally on tile but !isHidden && mine is an impossible state.
        if(mine && !mine.isHidden() && this.triggersMine(gameContext, mine)) {
            return EntityType.MAX_MOVE_COST;
        }
    }

    if(tileCost < EntityType.MIN_MOVE_COST) {
        tileCost = EntityType.MIN_MOVE_COST;
    }

    return tileCost;
}

BattalionEntity.prototype.mGetNodeMap = function(gameContext, nodeMap) {
    if(this.isDead() || !this.isMoveable()) {
        return;
    }

    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    const startID = worldMap.getIndex(this.tileX, this.tileY);
    const startNode = createNode(startID, this.tileX, this.tileY, 0, null, null, PATH_FLAG.START);
    const queue = [startNode];
    const visitedCost = new Map();
    const typeCache = new Map();

    nodeMap.set(startID, startNode);
    visitedCost.set(startID, 0);

    while(queue.length > 0) {
        const node = mGetLowestCostNode(queue);
        const { cost, x, y, id } = node;

        if(cost > this.config.movementRange) {
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

            const tileCost = cost + this.getTileCost(gameContext, worldMap, tileType, neighborX, neighborY);

            if(tileCost <= this.config.movementRange) {
                const bestCost = visitedCost.get(neighborID);

                if(bestCost === undefined || tileCost < bestCost) {
                    const childNode = createNode(neighborID, neighborX, neighborY, tileCost, type, id, flags);

                    queue.push(childNode);
                    visitedCost.set(neighborID, tileCost);
                    nodeMap.set(neighborID, childNode);
                }
            } else if(!nodeMap.has(neighborID)) {
                //Hacky but possible because every node has a minimum cost of 1.
                flags |= PATH_FLAG.UNREACHABLE;

                const childNode = createNode(neighborID, neighborX, neighborY, tileCost, type, id, flags);

                nodeMap.set(neighborID, childNode);
            }
        }
    }
}

BattalionEntity.prototype.canCapture = function(gameContext, tileX, tileY) {
    if(!this.hasTrait(TRAIT_TYPE.CONQUEROR)) {
        return false;
    }

    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return false;
    }

    const building = worldMap.getBuilding(tileX, tileY);

    if(!building) {
        return false;
    }

    if(!building.hasTrait(TRAIT_TYPE.CAPTURABLE)) {
        return false;
    }

    return building.isEnemy(gameContext, this.teamID);
}

BattalionEntity.prototype.canSee = function(gameContext, entity) {
    return entity.isVisibleTo(gameContext, this.teamID);
}

BattalionEntity.prototype.isVisibleTo = function(gameContext, teamID) {
    if(!this.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
        return true;
    }

    const { teamManager } = gameContext;
    const isAlly = teamManager.isAlly(this.teamID, teamID);

    return isAlly;
}

BattalionEntity.prototype.isPathWalkable = function(gameContext, path) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    let nextX = this.tileX;
    let nextY = this.tileY;
    let totalCost = 0;

    //Path[0] is the target.
    for(let i = path.length - 1; i >= 0; i--) {
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

        totalCost += this.getTileCost(gameContext, worldMap, tileType, nextX, nextY);

        if(totalCost > this.config.movementRange) {
            return false;
        }
    }

    return true;
}

BattalionEntity.prototype.isMoveTargetValid = function(gameContext, targetX, targetY) {
    const { world } = gameContext;
    const tileEntity = world.getEntityAt(targetX, targetY);

    if(tileEntity && tileEntity.isVisibleTo(gameContext, this.teamID)) {
        return false;
    }

    return true;
}

BattalionEntity.prototype.mInterceptPath = function(gameContext, mPath) {
    const { world } = gameContext;
    let nextX = this.tileX;
    let nextY = this.tileY;
    let elementsToDelete = mPath.length;

    for(let i = mPath.length - 1; i >= 0; i--) {
        const { deltaX, deltaY } = mPath[i];

        nextX += deltaX;
        nextY += deltaY;

        const entity = world.getEntityAt(nextX, nextY);

        if(!entity) {
            elementsToDelete = i;
        } else if(!entity.isVisibleTo(gameContext, this.teamID)) {
            mPath.splice(0, elementsToDelete);

            if(elementsToDelete !== i + 1) {
                return PATH_INTERCEPT.ILLEGAL;
            }

            return PATH_INTERCEPT.VALID;
        }
    }

    return PATH_INTERCEPT.NONE;
}

BattalionEntity.prototype.mInterceptMine = function(gameContext, mPath) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    let nextX = this.tileX;
    let nextY = this.tileY;

    for(let i = mPath.length - 1; i >= 0; i--) {
        const { deltaX, deltaY } = mPath[i];

        nextX += deltaX;
        nextY += deltaY;

        const mine = worldMap.getMine(nextX, nextY);

        if(mine && this.triggersMine(gameContext, mine)) {
            mPath.splice(0, i);

            return PATH_INTERCEPT.MINE;
        }
    }

    return PATH_INTERCEPT.NONE;
}

BattalionEntity.prototype.getTerrainTypes = function(gameContext) {
    const { world, typeRegistry } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const types = [];

    if(!worldMap) {
        return types;
    }

    const tags = new Set();
    const startX = this.tileX;
    const startY = this.tileY;
    const endX = startX + this.config.dimX;
    const endY = startY + this.config.dimY;

    for(let i = startY; i < endY; i++) {
        for(let j = startX; j < endX; j++) {
            const { terrain } = worldMap.getTileType(gameContext, j, i);

            for(const terrainID of terrain) {
                const terrainType = typeRegistry.getTerrainType(terrainID);
                const { id } = terrainType;

                if(!tags.has(id)) {
                    types.push(terrainType);
                    tags.add(id);
                }
            }
        }
    }

    return types;
}

BattalionEntity.prototype.isAttackPositionValid = function(gameContext, target) {
    if(!this.isRangeValid(gameContext, target)) {
        return false;
    }

    //Special ranged interaction for RANGE & HYBRID.
    switch(this.config.rangeType) {
        case RANGE_TYPE.RANGE: {
            //Protected targets cannot be shot.
            if(target.hasFlag(BattalionEntity.FLAG.IS_PROTECTED)) {
                return false;
            }

            break;
        }
        case RANGE_TYPE.HYBRID: {
            //Special case for entities with MIN_RANGE of 1 and MAX_RANGE of n.
            if(!this.isNextToEntity(target) && target.hasFlag(BattalionEntity.FLAG.IS_PROTECTED)) {
                return false;
            }

            break;
        }
    }

    //Streamblast and clean shot entities can only attack in a direct lane.
    if(!this.isAxisMeeting(target)) {
        if(this.hasTrait(TRAIT_TYPE.STREAMBLAST) || this.hasTrait(TRAIT_TYPE.CLEAR_SHOT)) {
            return false;
        }
    }

    return true;
}

BattalionEntity.prototype.isAttackValid = function(gameContext, target) {
    if(this.id === target.getID()) {
        return false;
    }
    
    if(this.damage <= 0) {
        return false;
    }

    if(this.config.weaponType === WEAPON_TYPE.NONE) {
        return false;
    }

    if(this.isDead() || target.isDead()) {
        return false;
    }

    //Stealth check. Cloaked units cannot be attacked.
    if(target.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
        return false;
    }

    //Allies cannot be attacked.
    if(this.isAllyWith(gameContext, target)) {
        return false;
    }

    if(target.config.category === ENTITY_CATEGORY.AIR) {
        //Air units can only be attacked with skysweeper.
        if(!this.hasTrait(TRAIT_TYPE.SKYSWEEPER)) {
            return false;
        }
    }

    //Seabound entities can only attack SEA units.
    if(target.config.category !== ENTITY_CATEGORY.SEA && this.hasTrait(TRAIT_TYPE.SEABOUND)) {
        return false;
    }

    //Special submarine case. Submarines can only be targeted by DEPTH_CHARGE.
    if(target.hasTrait(TRAIT_TYPE.SUBMERGED) && !this.hasTrait(TRAIT_TYPE.DEPTH_CHARGE)) {
        return false;
    }

    return true;
}

BattalionEntity.prototype.isHealPositionValid = function(gameContext, target) {
    if(!this.isRangeValid(gameContext, target)) {
        return false;
    }

    return true;
}

BattalionEntity.prototype.isHealValid = function(gameContext, target) {
    if(this.id === target.getID()) {
        return false;
    }

    if(this.damage <= 0) {
        return false;
    }

    if(this.isDead() || target.isDead()) {
        return false;
    }

    //Only suppliers can heal. 
    if(!this.hasTrait(TRAIT_TYPE.SUPPLY_DISTRIBUTION)) {
        return false;
    }

    //Stationary entities cannot be healed.
    if(target.config.movementType === MOVEMENT_TYPE.STATIONARY) {
        return false;
    }

    //Cannot heal enemies.
    if(!this.isAllyWith(gameContext, target)) {
        return false;
    }

    return true;
}

BattalionEntity.prototype.updateRangeGuard = function(gameContext) {
    //Air units are never protected by tiles/canyons!
    if(this.config.category === ENTITY_CATEGORY.AIR) {
        this.flags &= ~BattalionEntity.FLAG.IS_PROTECTED;

        return false;
    }

    const { world, typeRegistry } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    const startX = this.tileX;
    const startY = this.tileY;
    const endX = startX + this.config.dimX;
    const endY = startY + this.config.dimY;

    for(let i = startY; i < endY; i++) {
        for(let j = startX; j < endX; j++) {
            const { terrain } = worldMap.getTileType(gameContext, j, i);

            for(const terrainID of terrain) {
                const { rangeGuard } = typeRegistry.getTerrainType(terrainID);

                if(rangeGuard) {
                    this.flags |= BattalionEntity.FLAG.IS_PROTECTED;

                    return true;
                }
            }
        }
    }

    this.flags &= ~BattalionEntity.FLAG.IS_PROTECTED;

    return false;
}

BattalionEntity.prototype.isCounterValid = function(target) {
    //Only regular attackers can counter.
    if(this.getAttackType() !== ATTACK_TYPE.REGULAR || target.getAttackType() !== ATTACK_TYPE.REGULAR) {
        return false;
    }

    //Certain entities can never counter.
    if(this.hasTrait(TRAIT_TYPE.BLIND_SPOT) || this.hasTrait(TRAIT_TYPE.SELF_DESTRUCT)) {
        return false;
    }

    const targetID = target.getID();

    //Target should be the previous attacker.
    if(this.lastAttacker !== targetID) {
        return false;
    }

    //STUN can never be countered.
    if(target.hasTrait(TRAIT_TYPE.STUN)) {
        return false;
    }

    //TANK_HUNTER disables TRACKED from countering.
    if(target.hasTrait(TRAIT_TYPE.TANK_HUNTER) && this.config.movementType === MOVEMENT_TYPE.TRACKED) {
        return false;
    }

    switch(target.config.rangeType) {
        case RANGE_TYPE.RANGE: {
            if(!this.hasTrait(TRAIT_TYPE.COUNTER_BATTERY)) {
                return false;
            }

            break;
        }
        case RANGE_TYPE.HYBRID: {
            //Edge case: If two hybrids are next to each other, treat attacking as melee.
            if(!this.hasTrait(TRAIT_TYPE.COUNTER_BATTERY) && !this.isNextToEntity(target)) {
                return false;
            }

            break;
        }
    }

    return true;
}

BattalionEntity.prototype.getMoraleFactor = function(gameContext) {
    const { damageModifier } = this.getMorale(gameContext);

    return damageModifier;
}

BattalionEntity.prototype.getArmorFactor = function(gameContext, targetArmor) {
    const { typeRegistry } = gameContext;
    const armorType = typeRegistry.getArmorType(targetArmor);
    const resistance = armorType.getResistance(this.config.weaponType);
    let armorFactor = 1;

    //Maxes out at 100%
    if(resistance > 1) {
        armorFactor = 0;
    } else {
        armorFactor = (1 - resistance);
    }

    //Ignore only damage reduction with ARMOR_PIERCE, keep the damage increase.
    if(armorFactor < 1 && this.hasTrait(TRAIT_TYPE.ARMOR_PIERCE)) {
        armorFactor = 1;
    }

    return armorFactor;
}

BattalionEntity.prototype.getTerrainFactor = function(gameContext, target) {
    const { world, typeRegistry } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const targetMove = target.config.movementType;
    const targetX = target.tileX;
    const targetY = target.tileY;
    let terrainFactor = 1;

    const { terrain } = worldMap.getTileType(gameContext, targetX, targetY);

    for(let i = 0; i < terrain.length; i++) {
        const terrainType = typeRegistry.getTerrainType(terrain[i]);
        const protectionFactor = terrainType.getProtection(targetMove);

        //Terrain protection factor. Maxes out at 100%
        if(protectionFactor > 1) {
            terrainFactor = 0;
            break;
        } else {
            terrainFactor *= (1 - protectionFactor);
        }
    }

    return terrainFactor;
}

BattalionEntity.prototype.getLogisticFactor = function(gameContext) {
    const { world } = gameContext;
    const { mapManager } = world;
    let logisticFactor = 1;

    //Applies only to non-commandos.
    if(!this.hasTrait(TRAIT_TYPE.COMMANDO)) {
        const worldMap = mapManager.getActiveMap();
        const climateType = worldMap.getClimateType(gameContext, this.tileX, this.tileY);

        logisticFactor = climateType.logisticFactor;
    }

    return logisticFactor;
}

BattalionEntity.prototype.getHealthFactor = function() {
    let healthFactor = 1;

    if(!this.hasTrait(TRAIT_TYPE.INDOMITABLE)) {
        healthFactor = this.health / this.maxHealth;

        if(healthFactor > 1) {
            healthFactor = 1;
        }
    }

    return healthFactor;
}

BattalionEntity.prototype.getHealAmplifier = function(gameContext) {
    let damageAmplifier = 1;

    damageAmplifier *= this.getHealthFactor();
    damageAmplifier *= this.getMoraleFactor(gameContext);
    damageAmplifier *= this.getLogisticFactor(gameContext);

    return damageAmplifier;
}

BattalionEntity.prototype.getAttackAmplifier = function(gameContext, target, damageFlags) {
    const { typeRegistry } = gameContext;
    const targetArmor = target.config.armorType;
    const targetMove = target.config.movementType;

    let healthFactor = 1;
    let moraleFactor = 1;
    let armorFactor = 1;
    let terrainFactor = 1;
    let logisticFactor = 1;
    let traitFactor = 1;
    let otherFactor = 1;
    let damageAmplifier = 1;

    healthFactor = this.getHealthFactor();
    moraleFactor = this.getMoraleFactor(gameContext);
    armorFactor = this.getArmorFactor(gameContext, targetArmor);
    terrainFactor = this.getTerrainFactor(gameContext, target);
    logisticFactor = this.getLogisticFactor(gameContext);

    //Attacker traits.
    for(let i = 0; i < this.config.traits.length; i++) {
        const traitType = typeRegistry.getTraitType(this.config.traits[i]);
        
        //Move and armor factor.
        traitFactor *= traitType.getMoveDamage(targetMove);
        traitFactor *= traitType.getArmorDamage(targetArmor);
    }

    //Trait factor is supposed to be bonus damage. It CANNOT invert the damage.
    if(traitFactor < 0) {
        traitFactor = 0;
    }

    //Bonus damage if at full health.
    //TODO(neyn): Maybe move this to non-counters? CEMENTED_STEEL_ARMOR + ANNIHILATE would be broken.
    if(healthFactor >= 1 && this.hasTrait(TRAIT_TYPE.ANNIHILATE)) {
        otherFactor *= TRAIT_CONFIG.ANNIHILATE_DAMAGE;
    }

    //Bonus damage if target at full health.
    if(target.isAtFullHealth() && this.hasTrait(TRAIT_TYPE.BULLDOZE)) {
        otherFactor *= TRAIT_CONFIG.BULLDOZE_DAMAGE;
    }

    //Steer trait. Reduces damage received by STEER for each tile the target can travel further. Up to STEER_MAX_REDUCTION.
    if(this.config.category === ENTITY_CATEGORY.SEA && target.hasTrait(TRAIT_TYPE.STEER)) {
        const deltaRange = target.config.movementRange - this.config.movementRange;

        if(deltaRange > 0) {
            const steerAmplifier = 1 - (deltaRange * TRAIT_CONFIG.STEER_REDUCTION);

            if(steerAmplifier < TRAIT_CONFIG.STEER_MAX_REDUCTION) {
                otherFactor *= TRAIT_CONFIG.STEER_MAX_REDUCTION;
            } else {
                otherFactor *= steerAmplifier;
            }
        }
    }

    //If it's not a counter it must be a normal attack.
    if(damageFlags & ATTACK_FLAG.COUNTER) {
        if(this.hasTrait(TRAIT_TYPE.SLUGGER)) {
            healthFactor = 1;
        }
    } else {
        //Blitz factor.
        if(this.hasTrait(TRAIT_TYPE.BLITZ)) {
            otherFactor *= TRAIT_CONFIG.BLITZ_MULTIPLIER;
        }

        //Schwerpunkt factor.
        if(this.hasTrait(TRAIT_TYPE.SCHWERPUNKT) && targetMove === MOVEMENT_TYPE.FOOT) {
            otherFactor *= TRAIT_CONFIG.SCHWERPUNKT_MULTIPLIER;
        }

        //Stealth factor.
        if(this.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
            otherFactor *= TRAIT_CONFIG.STEALTH_MULTIPLIER;
        }

        const isExecutable = target.getVitality() < TRAIT_CONFIG.EXECUTIONER_THRESHOLD;

        if(isExecutable && this.hasTrait(TRAIT_TYPE.EXECUTIONER)) {
            otherFactor *= TRAIT_CONFIG.EXECUTIONER_DAMAGE;
        }
    }

    if(damageFlags & ATTACK_FLAG.SHRAPNEL) {
        otherFactor *= TRAIT_CONFIG.SHRAPNEL_DAMAGE;
    }

    damageAmplifier *= healthFactor;
    damageAmplifier *= moraleFactor;
    damageAmplifier *= armorFactor;
    damageAmplifier *= terrainFactor;
    damageAmplifier *= logisticFactor;
    damageAmplifier *= traitFactor;
    damageAmplifier *= otherFactor;

    return damageAmplifier;
}

BattalionEntity.prototype.getAttackDamage = function(gameContext, target, damageFlags) {
    const damageAmplifier = this.getAttackAmplifier(gameContext, target, damageFlags);
    let damage = this.damage * damageAmplifier;

	if(target.hasTrait(TRAIT_TYPE.CEMENTED_STEEL_ARMOR) && !this.hasTrait(TRAIT_TYPE.CAVITATION_EXPLOSION)) {
		damage -= TRAIT_CONFIG.CEMENTED_STEEL_ARMOR_REDUCTION;
	}

    if(damage < 0) {
		damage = 0;
	}

    //Unknown calculation.
	if(
        damage > 25 &&
        target.config.category === ENTITY_CATEGORY.AIR &&
        !this.hasTrait(TRAIT_TYPE.ANTI_AIR)
    ) {
		damage = 25;
	}

    if(this.hasTrait(TRAIT_TYPE.JUDGEMENT)) {
        damage = TRAIT_CONFIG.JUDGEMENT_DAMAGE;
    }

    return Math.floor(damage);
}

BattalionEntity.prototype.isAxisMeeting = function(target) {
    const { tileX, tileY } = target;
    const deltaX = this.tileX - tileX;
    const deltaY = this.tileY - tileY;

    return deltaX === 0 || deltaY === 0;
}

BattalionEntity.prototype.getDistanceToTile = function(tileX, tileY) {
    const deltaX = Math.abs(this.tileX - tileX);
    const deltaY = Math.abs(this.tileY - tileY);

    return deltaX + deltaY;
}

BattalionEntity.prototype.getDistanceToEntity = function(entity) {
    const { tileX, tileY } = entity;
    const distance = this.getDistanceToTile(tileX, tileY);
    
    return distance;
}

BattalionEntity.prototype.isNextToTile = function(tileX, tileY) {
    return this.getDistanceToTile(tileX, tileY) === 1;
}

BattalionEntity.prototype.isNextToEntity = function(entity) {
    return this.getDistanceToEntity(entity) === 1;
}

BattalionEntity.prototype.canCloak = function() {
    return !this.hasFlag(BattalionEntity.FLAG.IS_CLOAKED) && this.hasTrait(TRAIT_TYPE.STEALTH);
}

BattalionEntity.prototype.isSpottedBySpawner = function(gameContext, tileX, tileY) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const building = worldMap.getBuilding(tileX, tileY);
    const isSpotted = building && building.hasTrait(TRAIT_TYPE.SPAWNER) && building.isEnemy(gameContext, this.teamID);

    //Enemy stealth units must uncloak on a spawner as they'd leak information otherwise (spawning wouldn't work).
    return isSpotted;
}

BattalionEntity.prototype.canCloakAt = function(gameContext, tileX, tileY) {
    if(!this.canCloak()) {
        return false;
    }

    if(this.isDiscoveredByJammerAt(gameContext, tileX, tileY)) {
        return false;
    }

    const { world } = gameContext;
    const nearbyEntities = world.getEntitiesAround(tileX, tileY);

    for(let i = 0; i < nearbyEntities.length; i++) {
        if(!this.isAllyWith(gameContext, nearbyEntities[i])) {
            return false;
        }
    }

    if(this.isSpottedBySpawner(gameContext, tileX, tileY)) {
        return false;
    }

    return true;
}

BattalionEntity.prototype.hasWeapon = function() {
    return this.config.weaponType !== WEAPON_TYPE.NONE;
}

BattalionEntity.prototype.canCloakAtSelf = function(gameContext) {
    return this.canCloakAt(gameContext, this.tileX, this.tileY);
}

BattalionEntity.prototype.isMoveable = function() {
    return this.config.movementRange !== 0 && this.config.movementType !== MOVEMENT_TYPE.STATIONARY;
}

BattalionEntity.prototype.setActed = function() {
    this.setFlag(BattalionEntity.FLAG.HAS_ACTED);
    this.clearFlag(BattalionEntity.FLAG.CAN_MOVE | BattalionEntity.FLAG.CAN_ACT);
}

BattalionEntity.prototype.canActAndMove = function() {
    return (this.flags & BattalionEntity.FLAG.CAN_MOVE) && (this.flags & BattalionEntity.FLAG.CAN_ACT);
}

BattalionEntity.prototype.isSelectable = function() {
    return !this.isDead() && this.canActAndMove();
}

BattalionEntity.prototype.getUncloakedEntities = function(gameContext) {
    const { world, teamManager } = gameContext;
    const { mapManager, entityManager } = world;
    const worldMap = mapManager.getActiveMap();
    const jammerFlags = this.config.getJammerFlags();
    const searchRange = jammerFlags !== JAMMER_FLAG.NONE ? this.config.jammerRange : 1;
    const uncloakedEntities = [];
    let shouldSelfUncloak = false;

    worldMap.fill2DGraph(this.tileX, this.tileY, searchRange, (tileX, tileY, tileD, tileI) => {
        const index = worldMap.getEntity(tileX, tileY);
        const entity = entityManager.getEntityByIndex(index);

        if(!entity) {
            return;
        }

        const distance = entity.getDistanceToTile(this.tileX, this.tileY);

        switch(distance) {
            case 0: {
                //Distance 0 is the entity itself.
                break;
            }
            case 1: {
                //isVisibleTo check, but split up.
                if(!teamManager.isAlly(this.teamID, entity.teamID)) {
                    if(entity.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
                        uncloakedEntities.push(entity);
                    }

                    //Always uncloak next to an enemy, regardless of their state.
                    shouldSelfUncloak = true;
                }
                break;
            }
            default: {
                const cloakFlag = entity.config.getCloakFlag();

                if(jammerFlags & cloakFlag) {
                    if(!entity.hasTrait(TRAIT_TYPE.UNFAIR) && !entity.isVisibleTo(gameContext, this.teamID)) {
                        uncloakedEntities.push(entity);
                    }
                }
                break;
            }
        }
    });

   //Self uncloaking logic.
    if(this.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
        if(shouldSelfUncloak || this.isDiscoveredByJammerAt(gameContext, this.tileX, this.tileY) || this.isSpottedBySpawner(gameContext, this.tileX, this.tileY)) {
            uncloakedEntities.push(this);
        }
    }

    return uncloakedEntities;
}

BattalionEntity.prototype.isDiscoveredByJammer = function(gameContext) {
    return this.isDiscoveredByJammerAt(gameContext, this.tileX, this.tileY);
}

BattalionEntity.prototype.isDiscoveredByJammerAt = function(gameContext, tileX, tileY) {
    //UNFAIR entities ignore jammers.
    if(this.hasTrait(TRAIT_TYPE.UNFAIR)) {
        return false;
    }

    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const cloakFlag = this.config.getCloakFlag();

    return worldMap.isJammed(gameContext, tileX, tileY, this.teamID, cloakFlag);
}

BattalionEntity.prototype.getUncloakedMines = function(gameContext) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const jammerFlags = this.config.getJammerFlags();
    const searchRange = jammerFlags !== JAMMER_FLAG.NONE ? this.config.jammerRange : 0;
    const uncloakedMines = [];

    worldMap.fill2DGraph(this.tileX, this.tileY, searchRange, (tileX, tileY, distance, index) => {
        const mine = worldMap.getMine(tileX, tileY);

        if(mine && mine.isHidden()) {
            let isDetected = false;

            if(distance === 0) {
                isDetected = true;
            } else {
                const neededFlag = mine.getJammerFlag();

                isDetected = (jammerFlags & neededFlag) !== 0;
            }

            if(isDetected && mine.isEnemy(gameContext, this.teamID)) {
                uncloakedMines.push(mine);
            }
        }
    });

    return uncloakedMines;
}

BattalionEntity.prototype.getMaxRange = function(gameContext) {
    const terrainTypes = this.getTerrainTypes(gameContext);
    let range = this.config.maxRange;

    for(let i = 0; i < terrainTypes.length; i++) {
        range += terrainTypes[i].rangeBoost;
    }

    if(range < this.config.minRange) {
        range = this.config.minRange;
    }
    
    return range;
}

BattalionEntity.prototype.getDistanceMoved = function(deltaTime) {
    return this.config.movementSpeed * deltaTime;
}

BattalionEntity.prototype.fromTransport = function(gameContext) {
    if(this.transportID !== ENTITY_TYPE._INVALID) {
        const { typeRegistry } = gameContext;
        const transportType = typeRegistry.getEntityType(this.transportID);
        const previousHealthFactor = this.health / this.maxHealth;

        this.loadConfig(transportType);
        this.setHealth(this.maxHealth * previousHealthFactor);
        this.transportID = ENTITY_TYPE._INVALID;
    }
}

BattalionEntity.prototype.toTransport = function(gameContext, transportType) {
    if(this.transportID === ENTITY_TYPE._INVALID) {
        const { typeRegistry } = gameContext;
        const previousHealthFactor = this.health / this.maxHealth;
        const entityTypeID = mapTransportToEntity(transportType);
        const transportConfig = typeRegistry.getEntityType(entityTypeID);

        this.transportID = this.config.id;
        this.loadConfig(transportConfig);
        this.setHealth(this.maxHealth * previousHealthFactor);
    }
}

BattalionEntity.prototype.isJammer = function() {
    return this.config.jammerRange > 0 && this.config.getJammerFlags() !== JAMMER_FLAG.NONE;
}

BattalionEntity.prototype.setUncloaked = function() {
    this.clearFlag(BattalionEntity.FLAG.IS_CLOAKED);

    if(this.hasTrait(TRAIT_TYPE.SUBMERGED)) {
        this.clearFlag(BattalionEntity.FLAG.IS_SUBMERGED);
    }
}

BattalionEntity.prototype.setCloaked = function() {
    this.setFlag(BattalionEntity.FLAG.IS_CLOAKED);

    if(this.hasTrait(TRAIT_TYPE.SUBMERGED)) {
        this.setFlag(BattalionEntity.FLAG.IS_SUBMERGED);
    }
}

BattalionEntity.prototype.clearLastAttacker = function() {
    this.lastAttacker = EntityManager.INVALID_ID;
}

BattalionEntity.prototype.setLastAttacker = function(entityID) {
    if(entityID !== this.id) {
        this.lastAttacker = entityID;
    }
}

BattalionEntity.prototype.onTurnStart = function() {
    this.clearFlag(BattalionEntity.FLAG.HAS_MOVED | BattalionEntity.FLAG.HAS_ACTED);
    this.clearFlag(BattalionEntity.FLAG.BEWEGUNGSKRIEG_TRIGGERED | BattalionEntity.FLAG.ELUSIVE_TRIGGERED);
    this.setFlag(BattalionEntity.FLAG.CAN_MOVE | BattalionEntity.FLAG.CAN_ACT | BattalionEntity.FLAG.IS_TURN);
    this.clearLastAttacker();
} 

BattalionEntity.prototype.onTurnEnd = function() {
    this.setFlag(BattalionEntity.FLAG.HAS_MOVED | BattalionEntity.FLAG.HAS_ACTED);
    this.clearFlag(BattalionEntity.FLAG.CAN_MOVE | BattalionEntity.FLAG.CAN_ACT | BattalionEntity.FLAG.IS_TURN);
    this.clearLastAttacker();
    this.turns++;
}

BattalionEntity.prototype.triggerBewegungskrieg = function() {
    if(!this.hasFlag(BattalionEntity.FLAG.BEWEGUNGSKRIEG_TRIGGERED)) {
        //Clear HAS_ACTED and HAS_MOVED to allow MoveAction to potentially queue again.
        this.clearFlag(BattalionEntity.FLAG.HAS_MOVED | BattalionEntity.FLAG.HAS_ACTED);
        this.setFlag(BattalionEntity.FLAG.BEWEGUNGSKRIEG_TRIGGERED | BattalionEntity.FLAG.CAN_MOVE | BattalionEntity.FLAG.CAN_ACT);
    }
}

BattalionEntity.prototype.triggerElusive = function() {
    if(!this.hasFlag(BattalionEntity.FLAG.ELUSIVE_TRIGGERED)) {
        this.setFlag(BattalionEntity.FLAG.ELUSIVE_TRIGGERED | BattalionEntity.FLAG.CAN_MOVE);
    }
}

BattalionEntity.prototype.getOverheatDamage = function() {
    return this.maxHealth * TRAIT_CONFIG.OVERHEAT_DAMAGE;
}

BattalionEntity.prototype.getAbsorberHeal = function(damage) {
    return damage * TRAIT_CONFIG.ABSORBER_RATE;
}

BattalionEntity.prototype.getDamageAsResources = function(damage) {
    return damage / this.maxHealth * this.config.cost;
}

BattalionEntity.prototype.mResolveAttackTraits = function(resolver) {
    if(this.hasTrait(TRAIT_TYPE.SELF_DESTRUCT)) {
        resolver.add(this.id, this.health, 0);

    } else if(this.hasTrait(TRAIT_TYPE.OVERHEAT)) {
        const overheatDamage = this.getOverheatDamage();
        const overheatHealth = this.getHealthAfterAttack(overheatDamage);

        resolver.add(this.id, overheatDamage, overheatHealth);

    } else if(this.hasTrait(TRAIT_TYPE.ABSORBER)) {
        const { totalDamage } = resolver;
        const absorberHeal = this.getAbsorberHeal(totalDamage);

        resolver.addHeal(this, Math.floor(absorberHeal));
    }
}

BattalionEntity.prototype.isHurtByShrapnel = function() {
    //Shrapnel does not hurt air and submerged units.
    return this.config.category !== ENTITY_CATEGORY.AIR && !this.hasFlag(BattalionEntity.FLAG.IS_SUBMERGED);
}

BattalionEntity.prototype.mResolveShrapnel = function(gameContext, target, damageFlags, resolver) {
    const { tileX, tileY } = target;
    const direction = this.getDirectionTo(target);
    const targets = getLineEntities(gameContext, direction, tileX, tileY, TRAIT_CONFIG.SHRAPNEL_RANGE);
    const flags = damageFlags | ATTACK_FLAG.SHRAPNEL;

    for(let i = 0; i < targets.length; i++) {
        const target = targets[i];

        if(target.isHurtByShrapnel()) {
            const damage = this.getAttackDamage(gameContext, target, flags);

            resolver.addAttack(target, damage);
        }
    }
}

BattalionEntity.prototype.isHurtByStreamblast = function() {
    //Streamblast does not hurt air and submerged units.
    return this.config.category !== ENTITY_CATEGORY.AIR && !this.hasFlag(BattalionEntity.FLAG.IS_SUBMERGED);
}

BattalionEntity.prototype.mResolveStreamblastAttack = function(gameContext, target, resolver) {
    const direction = this.getDirectionTo(target);
    const targets = getLineEntities(gameContext, direction, this.tileX, this.tileY, this.config.streamRange);

    for(let i = 0; i < targets.length; i++) {
        const target = targets[i];

        if(target.isHurtByStreamblast()) {
            const damage = this.getAttackDamage(gameContext, target, ATTACK_FLAG.STREAMBLAST);

            resolver.addAttack(target, damage);
        }
    }

    this.mResolveAttackTraits(resolver);
}

BattalionEntity.prototype.isHurtByDispersion = function() {
    //Dispersion does not hurt air units, but unlike SHRAPNEL and STREAMBLAST hurts IS_SUBMERGED units.
    return this.config.category !== ENTITY_CATEGORY.AIR;
}

BattalionEntity.prototype.mResolveDispersionAttack = function(gameContext, target, resolver) {
    const { world } = gameContext;
    const { tileX, tileY } = target;
    const range = this.hasTrait(TRAIT_TYPE.JUDGEMENT) ? TRAIT_CONFIG.JUDGEMENT_RANGE : TRAIT_CONFIG.DISPERSION_RANGE;
    const targets = world.getEntitiesInRange(tileX, tileY, range, range);

    for(let i = 0; i < targets.length; i++) {
        const target = targets[i];

        if(target.isHurtByDispersion() && this.id !== target.id) {
            const damage = this.getAttackDamage(gameContext, target, ATTACK_FLAG.AREA);

            resolver.addAttack(target, damage);
        }
    }

    this.mResolveAttackTraits(resolver);
}

BattalionEntity.prototype.mResolveCounterAttack = function(gameContext, target, resolver) {
    const damage = this.getAttackDamage(gameContext, target, ATTACK_FLAG.COUNTER);

    resolver.addAttack(target, damage);

    if(this.hasTrait(TRAIT_TYPE.SHRAPNEL)) {
        this.mResolveShrapnel(gameContext, target, ATTACK_FLAG.COUNTER, resolver);
    }

    this.mResolveAttackTraits(resolver);
}

BattalionEntity.prototype.mResolveRegularAttack = function(gameContext, target, resolver) {
    const damage = this.getAttackDamage(gameContext, target, ATTACK_FLAG.NONE);

    resolver.addAttack(target, damage);

    if(this.hasTrait(TRAIT_TYPE.SHRAPNEL)) {
        this.mResolveShrapnel(gameContext, target, ATTACK_FLAG.NONE, resolver);
    }

    this.mResolveAttackTraits(resolver);
}

BattalionEntity.prototype.mResolveHeal = function(gameContext, target, resolver) {
    const amplifier = this.getHealAmplifier(gameContext);
    const heal = Math.floor(this.damage * amplifier);

    resolver.addHeal(target, heal);
}

BattalionEntity.prototype.placeOnMap = function(gameContext) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return;
    }

    const { dimX, dimY, jammerRange } = this.config;
    const jammerFlags = this.config.getJammerFlags();

    worldMap.addEntity(this.tileX, this.tileY, dimX, dimY, this.index);

    if(jammerFlags !== JAMMER_FLAG.NONE) {
        worldMap.fill2DGraph(this.tileX, this.tileY, jammerRange, (nextX, nextY) => {
            worldMap.addJammer(nextX, nextY, this.id, this.teamID, jammerFlags);
        });
    }

    this.updateRangeGuard(gameContext);
}

BattalionEntity.prototype.removeFromMap = function(gameContext) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return;
    }

    const { dimX, dimY, jammerRange } = this.config;
    const jammerFlags = this.config.getJammerFlags();

    worldMap.removeEntity(this.tileX, this.tileY, dimX, dimY, this.index);

    if(jammerFlags !== JAMMER_FLAG.NONE) {
        worldMap.fill2DGraph(this.tileX, this.tileY, jammerRange, (nextX, nextY) => {
            worldMap.removeJammer(nextX, nextY, this.id, this.teamID, jammerFlags);
        });
    }
}

BattalionEntity.prototype.getOreValue = function(gameContext) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    return worldMap.getOreValue(this.tileX, this.tileY);
}

BattalionEntity.prototype.extractOre = function(gameContext) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    worldMap.extractOre(this.tileX, this.tileY);
}

BattalionEntity.prototype.setPurchased = function() {
    //Set this.turns to 0, because it is the entities first turn.
    //It will be set to 1 when onTurnEnd is called from the EndTurnAction!
    this.onTurnEnd();
    this.flags |= BattalionEntity.FLAG.IS_TURN;
    this.turns = 0;
}

BattalionEntity.prototype.discoversMine = function(gameContext) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const mine = worldMap.getMine(this.tileX, this.tileY);

    if(!mine) {
        return false;
    }

    return mine.isHidden() && mine.isEnemy(gameContext, this.teamID);
}
 
BattalionEntity.prototype.triggersMine = function(gameContext, mine) {
    const damage = mine.getDamage(this.config.movementType);

    //Only mines that deal damage blow up.
    if(damage <= 0) {
        return false;
    }

    const traitID = mine.getNullifierTrait();

    //Some traits can dodge mines.
    //These are defined in mine.js
    if(this.hasTrait(traitID)) {
        return false;
    }

    //Only enemy mines blow up.
    return mine.isEnemy(gameContext, this.teamID);
}

BattalionEntity.prototype.canPurchase = function(gameContext, typeID, cost) {
    if(cost > this.cash) {
        return false;
    }

    const { typeRegistry } = gameContext;
    const shopType = typeRegistry.getShopType(this.config.shop);
    const hasEntity = shopType.hasEntity(typeID);

    return hasEntity;
}

BattalionEntity.prototype.reduceCash = function(cash) {
    this.cash -= cash;
}

//TODO(neyn): Most of this must be calculated in MinePlaceAction!
BattalionEntity.prototype.canPlaceMine = function(gameContext) {
    const { world, typeRegistry } = gameContext;
    const { mapManager } = world;

    //Only engineers are able to place mines.
    if(!this.hasTrait(TRAIT_TYPE.ENGINEER)) {
        return false;
    }

    //TODO: Cost needs inflation adjustment
    const { mine } = typeRegistry.getShopType(this.config.shop);
    const { cost, category } = typeRegistry.getMineType(mine);

    if(this.cash < cost) {
        return false;
    }

    //Tiles should only be placeable on the units feet.
    //_INVALID mines will never be placeable.
    const worldMap = mapManager.getActiveMap();
    const isPlaceable = worldMap.isMinePlaceable(gameContext, this.tileX, this.tileY, category);

    return isPlaceable;
}

BattalionEntity.prototype.getDescription = function(gameContext) {
    const { language } = gameContext;
    
    if(this.customDesc !== LanguageHandler.INVALID_ID) {
        return language.getMapTranslation(this.customDesc);
    }

    return language.getSystemTranslation(this.config.desc);
}

BattalionEntity.prototype.getName = function(gameContext) {
    const { language } = gameContext;
    
    if(this.customName !== LanguageHandler.INVALID_ID) {
        return language.getMapTranslation(this.customName);
    }

    return language.getSystemTranslation(this.config.name);
}

BattalionEntity.prototype.setOpacity = function(opacity) {
    this.opacity = opacity;
}