import { Entity } from "../../engine/entity/entity.js";
import { EntityHelper } from "../../engine/entity/entityHelper.js";
import { EntityManager } from "../../engine/entity/entityManager.js";
import { FlagHelper } from "../../engine/flagHelper.js";
import { LanguageHandler } from "../../engine/language/languageHandler.js";
import { WorldMap } from "../../engine/map/worldMap.js";
import { isRectangleRectangleIntersect } from "../../engine/math/math.js";
import { FloodFill } from "../../engine/pathfinders/floodFill.js";
import { AttackAction } from "../action/types/attack.js";
import { JammerField } from "../map/jammerField.js";
import { TypeRegistry } from "../type/typeRegistry.js";
import { EntityType } from "./entityType.js";

const SHRAPNEL_RANGE = 1;

const ABSORBER_RATE = 0.2;

const OVERHEAT_DAMAGE = 0.1;

const HEROIC_THRESHOLD = 1;

const DAMAGE_AMPLIFIER = {
    STEER: 0.1,
    STEER_MAX_REDUCTION: 0.5,
    SCHWERPUNKT: 1.4,
    STEALTH: 2
};

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

export const BattalionEntity = function(id, sprite) {
    Entity.call(this, id, "");

    this.health = EntityType.DEFAULT.HEALTH;
    this.maxHealth = EntityType.DEFAULT.HEALTH;
    this.damage = EntityType.DEFAULT.DAMAGE;
    this.movementRange = EntityType.DEFAULT.MOVEMENT_RANGE;
    this.moraleType = TypeRegistry.MORALE_TYPE.NONE;
    this.moraleAmplifier = 1;
    this.customName = null;
    this.customDesc = null;
    this.customID = null;
    this.sprite = sprite;
    this.tileX = -1;
    this.tileY = -1;
    this.tileZ = -1;
    this.direction = BattalionEntity.DIRECTION.EAST;
    this.state = BattalionEntity.STATE.IDLE;
    this.teamID = null;
    this.transportID = null;
    this.lastAttacker = -1;
}

BattalionEntity.HYBRID_ENABLED = false;

BattalionEntity.RANGE_TYPE = {
    NONE: 0,
    MELEE: 1,
    RANGE: 2,
    HYBRID: 3
};

BattalionEntity.ATTACK_TYPE = {
    REGULAR: 0,
    STREAMBLAST: 1,
    DISPERSION: 2
};

BattalionEntity.FLAG = {
    NONE: 0,
    HAS_MOVED: 1 << 0,
    HAS_ATTACKED: 1 << 1,
    IS_CLOAKED: 1 << 2,
    IS_SUBMERGED: 1 << 3,
    BEWEGUNGSKRIEG_TRIGGERED: 1 << 4,
    ELUSIVE_TRIGGERED: 1 << 5
};

BattalionEntity.PATH_FLAG = {
    NONE: 0b00000000,
    UNREACHABLE: 1 << 0,
    START: 1 << 1
};

BattalionEntity.MIN_MOVE_COST = 1;
BattalionEntity.MAX_MOVE_COST = 99;

BattalionEntity.DIRECTION = {
    NORTH: 1 << 0,
    EAST: 1 << 1,
    SOUTH: 1 << 2,
    WEST: 1 << 3
};

BattalionEntity.STATE = {
    IDLE: 0,
    MOVE: 1,
    FIRE: 2,
    DEAD: 3
};

BattalionEntity.TRANSPORT_TYPE = {
    BARGE: 0,
    PELICAN: 1,
    STORK: 2
};

BattalionEntity.INTERCEPT = {
    NONE: 0,
    VALID: 1,
    ILLEGAL: 2
};

BattalionEntity.DAMAGE_FLAG = {
    NONE: 0,
    SHRAPNEL: 1 << 0,
    GAS: 1 << 1,
    JUDGEMENT: 1 << 2
};

BattalionEntity.SPRITE_TYPE = {
    IDLE_RIGHT: "idle_right",
    IDLE_LEFT: "idle_left",
    IDLE_DOWN: "idle_down",
    IDLE_UP: "idle_up",
    FIRE_RIGHT: "fire_right",
    FIRE_LEFT: "fire_left",
    FIRE_DOWN: "fire_down",
    FIRE_UP: "fire_up",
    ATTACK: "attack",
    DEATH: "death"
};

BattalionEntity.SOUND_TYPE = {
    MOVE: "move",
    FIRE: "fire",
    CLOAK: "cloak",
    DEATH: "death",
    RECRUIT: "recruit",
    UNCLOAK: "uncloak"
};

BattalionEntity.DEFAULT_ATTACK_SPRITES = {
    [BattalionEntity.ATTACK_TYPE.REGULAR]: "small_attack",
    [BattalionEntity.ATTACK_TYPE.DISPERSION]: "gas_attack",
    [BattalionEntity.ATTACK_TYPE.STREAMBLAST]: "small_attack" //TODO: Implement
};

BattalionEntity.DEFAULT_SPRITES = {
    [BattalionEntity.SPRITE_TYPE.DEATH]: "explosion"
};

BattalionEntity.DEFAULT_SOUNDS = {
    [BattalionEntity.SOUND_TYPE.CLOAK]: "cloak",
    [BattalionEntity.SOUND_TYPE.DEATH]: "explosion",
    [BattalionEntity.SOUND_TYPE.UNCLOAK]: "uncloak",
};

BattalionEntity.getDirectionByDelta = function(deltaX, deltaY) {
    if(deltaY < 0) return BattalionEntity.DIRECTION.NORTH;
    if(deltaY > 0) return BattalionEntity.DIRECTION.SOUTH;
    if(deltaX < 0) return BattalionEntity.DIRECTION.WEST;
    if(deltaX > 0) return BattalionEntity.DIRECTION.EAST;

    return BattalionEntity.DIRECTION.EAST;
}

BattalionEntity.createStep = function(deltaX, deltaY, tileX, tileY) {
    return {
        "deltaX": deltaX,
        "deltaY": deltaY,
        "tileX": tileX,
        "tileY": tileY
    }
}

BattalionEntity.isNodeReachable = function(node) {
    const { flags } = node;

    if(FlagHelper.hasFlag(flags, BattalionEntity.PATH_FLAG.UNREACHABLE)) {
        return false;
    }

    return true;
}

BattalionEntity.getLineTargets = function(gameContext, direction, startX, startY, maxRange) {
    let streamX = 0;
    let streamY = 0;

    switch(direction) {
        case BattalionEntity.DIRECTION.EAST: {
            streamX = 1;
            break;
        }
        case BattalionEntity.DIRECTION.NORTH: {
            streamY = -1;
            break;
        }
        case BattalionEntity.DIRECTION.SOUTH: {
            streamY = 1;
            break;
        }
        case BattalionEntity.DIRECTION.WEST: {
            streamX = -1;
            break;
        }
        default: {
            console.error("Faulty direction! Using EAST.");
            streamX = 1;
            break;
        }
    }

    const { world } = gameContext;
    const { mapManager, entityManager } = world;
    const worldMap = mapManager.getActiveMap();
    const targets = [];

    let currentX = startX + streamX;
    let currentY = startY + streamY;
    let range = 0;

    while(range < maxRange && !worldMap.isTileOutOfBounds(currentX, currentY)) {
        const entityID = worldMap.getTopEntity(currentX, currentY);
        const entity = entityManager.getEntity(entityID);

        if(entity) {
            targets.push(entity);
        }

        currentX += streamX;
        currentY += streamY;
        range++;
    }

    return targets;
}

BattalionEntity.getAOETargets = function(gameContext, tileX, tileY, range) {
    const { world } = gameContext;
    const { mapManager, entityManager } = world;
    const worldMap = mapManager.getActiveMap();
    const targets = [];
    
    worldMap.fill2DArea(tileX, tileY, range, range, (nextX, nextY) => {
        const entityID = worldMap.getTopEntity(nextX, nextY);
        const entity = entityManager.getEntity(entityID);

        if(entity) {
            targets.push(entity);
        }
    });

    return targets;
}

BattalionEntity.prototype = Object.create(Entity.prototype);
BattalionEntity.prototype.constructor = BattalionEntity;

BattalionEntity.prototype.loadConfig = function(config) {
    const { health, movementRange, damage } = config;

    this.config = config;
    this.health = health;
    this.maxHealth = health;
    this.damage = damage;
    this.movementRange = movementRange;

    if(this.movementRange >= BattalionEntity.MAX_MOVE_COST) {
        this.movementRange = BattalionEntity.MAX_MOVE_COST;
    }

    this.setHealth(this.health);
}

BattalionEntity.prototype.getAttackType = function() {
    if(this.hasTrait(TypeRegistry.TRAIT_TYPE.DISPERSION) || this.hasTrait(TypeRegistry.TRAIT_TYPE.JUDGEMENT)) {
        return BattalionEntity.ATTACK_TYPE.DISPERSION;
    }

    if(this.hasTrait(TypeRegistry.TRAIT_TYPE.STREAMBLAST)) {
        return BattalionEntity.ATTACK_TYPE.STREAMBLAST;
    }

    return BattalionEntity.ATTACK_TYPE.REGULAR;
}

BattalionEntity.prototype.isRangeEnough = function(gameContext, entity) {
    const distance = this.getDistanceToEntity(entity);

    if(distance < this.config.minRange) {
        return false;
    }

    return distance <= this.getMaxRange(gameContext);
}

BattalionEntity.prototype.isAnimationFinished = function() {
    return this.sprite.visual.isFinished();
}

BattalionEntity.prototype.getHealthAfter = function(damage) {
    const health = this.health - damage;

    if(health <= 0) {

        if(this.health > HEROIC_THRESHOLD && this.hasTrait(TypeRegistry.TRAIT_TYPE.HEROIC)) {
            return 1;
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

    this.sprite.onHealthUpdate(this.health, this.maxHealth);
}

BattalionEntity.prototype.setCustomInfo = function(id, name, desc) {
    this.customID = id;

    if(name) {
        this.customName = name;
    }

    if(desc) {
        this.customDesc = desc;
    }
}

BattalionEntity.prototype.getDisplayDesc = function(gameContext) {
    const { language } = gameContext;
    
    if(this.customDesc) {
        return language.get(this.customDesc, LanguageHandler.TAG_TYPE.MAP);
    }

    return language.get(this.config.desc);
}

BattalionEntity.prototype.getDisplayName = function(gameContext) {
    const { language } = gameContext;
    
    if(this.customName) {
        return language.get(this.customName, LanguageHandler.TAG_TYPE.MAP);
    }

    return language.get(this.config.name);
}

BattalionEntity.prototype.hasTrait = function(traitID) {
    for(let i = 0; i < this.config.traits.length; i++) {
        if(this.config.traits[i] === traitID) {
            return true;
        }
    }

    return false;
}

BattalionEntity.prototype.destroy = function() {
    this.isMarkedForDestroy = true;
    this.sprite.destroy();
}

BattalionEntity.prototype.setTile = function(tileX, tileY) {
    this.tileX = tileX;
    this.tileY = tileY;
}

BattalionEntity.prototype.updatePosition = function(deltaX, deltaY) {
    this.sprite.updatePosition(deltaX, deltaY);
}

BattalionEntity.prototype.setPosition = function(positionX, positionY) {
    this.sprite.setPosition(positionX, positionY);
}

BattalionEntity.prototype.setPositionVec = function(positionVector) {
    const { x, y } = positionVector;

    this.sprite.setPosition(x, y);
}

BattalionEntity.prototype.setDirection = function(direction) {
    if(this.direction === direction) {
        return false;
    }

    if(Object.values(BattalionEntity.DIRECTION).includes(direction)) {
        this.direction = direction;

        return true;
    }

    return false;
}

BattalionEntity.prototype.playIdle = function(gameContext) {
    this.state = BattalionEntity.STATE.IDLE;
    this.updateSprite(gameContext);
    this.sprite.unlockEnd();
}

BattalionEntity.prototype.playCloak = function(gameContext) {
    this.setFlag(BattalionEntity.FLAG.IS_CLOAKED);
    this.playSound(gameContext, BattalionEntity.SOUND_TYPE.CLOAK);
}

BattalionEntity.prototype.playUncloak = function(gameContext) {
    this.playSound(gameContext, BattalionEntity.SOUND_TYPE.UNCLOAK);
}

BattalionEntity.prototype.playMove = function(gameContext) {
    this.state = BattalionEntity.STATE.MOVE;
    this.updateSprite(gameContext);
    this.playSound(gameContext, BattalionEntity.SOUND_TYPE.MOVE);
}

BattalionEntity.prototype.playDeath = function(gameContext) {
    const { spriteManager, transform2D } = gameContext;
    const spriteType = this.getDeathSprite();

    this.state = BattalionEntity.STATE.DEAD;
    this.playSound(gameContext, BattalionEntity.SOUND_TYPE.DEATH);

    const sprite = spriteManager.createSprite(spriteType, TypeRegistry.LAYER_TYPE.GFX);

    if(sprite) {
        const { x, y } = transform2D.transformTileToWorld(this.tileX, this.tileY);

        sprite.setPosition(x, y);
        sprite.expire();
    }
}

BattalionEntity.prototype.playAttack = function(gameContext) {
    this.state = BattalionEntity.STATE.FIRE;
    this.playSound(gameContext, BattalionEntity.SOUND_TYPE.FIRE);
    this.updateSprite(gameContext);
    this.sprite.lockEnd();
}

BattalionEntity.prototype.playCounter = function(gameContext, target) {
    this.playAttack(gameContext, target);
}

BattalionEntity.prototype.setDirectionByDelta = function(deltaX, deltaY) {
    const direction = BattalionEntity.getDirectionByDelta(deltaX, deltaY);

    return this.setDirection(direction);
}

BattalionEntity.prototype.getDirectionTo = function(entity) {
    const deltaX = entity.tileX - this.tileX;
    const deltaY = entity.tileY - this.tileY;
    const distanceX = Math.abs(deltaX);
    const distanceY = Math.abs(deltaY);

    if(distanceX > distanceY) {
        return BattalionEntity.getDirectionByDelta(deltaX, 0);
    } else {
        return BattalionEntity.getDirectionByDelta(0, deltaY);
    }
}

BattalionEntity.prototype.lookAt = function(entity) {
    const direction = this.getDirectionTo(entity);

    return this.setDirection(direction);
}

BattalionEntity.prototype.getSpriteType = function() {
    switch(this.state) {
        case BattalionEntity.STATE.IDLE: {
            switch(this.direction) {
                case BattalionEntity.DIRECTION.NORTH: return BattalionEntity.SPRITE_TYPE.IDLE_UP;
                case BattalionEntity.DIRECTION.EAST: return BattalionEntity.SPRITE_TYPE.IDLE_RIGHT;
                case BattalionEntity.DIRECTION.SOUTH: return BattalionEntity.SPRITE_TYPE.IDLE_DOWN;
                case BattalionEntity.DIRECTION.WEST: return BattalionEntity.SPRITE_TYPE.IDLE_LEFT;
            }
            break;
        }
        case BattalionEntity.STATE.MOVE: {
            switch(this.direction) {
                case BattalionEntity.DIRECTION.NORTH: return BattalionEntity.SPRITE_TYPE.IDLE_UP;
                case BattalionEntity.DIRECTION.EAST: return BattalionEntity.SPRITE_TYPE.IDLE_RIGHT;
                case BattalionEntity.DIRECTION.SOUTH: return BattalionEntity.SPRITE_TYPE.IDLE_DOWN;
                case BattalionEntity.DIRECTION.WEST: return BattalionEntity.SPRITE_TYPE.IDLE_LEFT;
            }
            break;
        }
        case BattalionEntity.STATE.FIRE: {
            switch(this.direction) {
                case BattalionEntity.DIRECTION.NORTH: return BattalionEntity.SPRITE_TYPE.FIRE_UP;
                case BattalionEntity.DIRECTION.EAST: return BattalionEntity.SPRITE_TYPE.FIRE_RIGHT;
                case BattalionEntity.DIRECTION.SOUTH: return BattalionEntity.SPRITE_TYPE.FIRE_DOWN;
                case BattalionEntity.DIRECTION.WEST: return BattalionEntity.SPRITE_TYPE.FIRE_LEFT;
            }
            break;
        }
    }

    return BattalionEntity.SPRITE_TYPE.IDLE_RIGHT;
}

BattalionEntity.prototype.getDeathSprite = function() {
    let sprite = this.config.sprites[BattalionEntity.SPRITE_TYPE.DEATH];

    if(!sprite) {
        sprite = BattalionEntity.DEFAULT_SPRITES[BattalionEntity.SPRITE_TYPE.DEATH];
    }

    return sprite;
}

BattalionEntity.prototype.getAttackSprite = function() {
    let sprite = this.config.sprites[BattalionEntity.SPRITE_TYPE.ATTACK];

    if(!sprite) {
        const attackType = this.getAttackType();

        sprite = BattalionEntity.DEFAULT_ATTACK_SPRITES[attackType];
    }

    return sprite;
}

BattalionEntity.prototype.updateSprite = function(gameContext) {
    const spriteType = this.getSpriteType();
    const spriteID = this.config.sprites[spriteType];

    if(spriteID) {
        this.sprite.updateType(gameContext, spriteID);
    }
}

BattalionEntity.prototype.updateSchema = function(gameContext, schemaID, schema) {
    this.sprite.updateSchema(gameContext, schemaID, schema);
}

BattalionEntity.prototype.setTeam = function(teamID) {
    this.teamID = teamID;
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

BattalionEntity.prototype.getTileCost = function(gameContext, worldMap, tileType, tileX, tileY) {
    const { world, typeRegistry } = gameContext;
    const { entityManager } = world;
    const { terrain, passability } = tileType;
    let tileCost = passability[this.config.movementType] ?? BattalionEntity.MAX_MOVE_COST;

    if(tileCost === BattalionEntity.MAX_MOVE_COST) {
        return BattalionEntity.MAX_MOVE_COST;
    }

    if(this.config.movementType === TypeRegistry.MOVEMENT_TYPE.FLIGHT) {
        const jammer = worldMap.getJammer(tileX, tileY);

        if(jammer.isJammed(gameContext, this.teamID, JammerField.FLAG.AIRSPACE_BLOCKED)) {
            return BattalionEntity.MAX_MOVE_COST;
        }
    }
    
    for(let i = 0; i < terrain.length; i++) {
        const { cost } = typeRegistry.getTerrainType(terrain[i]);
        const terrainModifier = cost[this.config.movementType] ?? 0;

        tileCost += terrainModifier;
    }

    const entityID = worldMap.getTopEntity(tileX, tileY);
    const entity = entityManager.getEntity(entityID);
    
    if(entity) {
        //Blocks on non-cloaked enemy units. Ignores cloaked enemy units and treats them as walkable.
        if(!this.isAllyWith(gameContext, entity) && !entity.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
            tileCost += BattalionEntity.MAX_MOVE_COST;
        }
    }

    if(tileCost < BattalionEntity.MIN_MOVE_COST) {
        tileCost = BattalionEntity.MIN_MOVE_COST;
    }

    return tileCost;
}

BattalionEntity.prototype.mGetNodeMap = function(gameContext, nodeMap) {
    if(this.isDead() || !this.canMove()) {
        return;
    }

    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    const startID = worldMap.getIndex(this.tileX, this.tileY);
    const startNode = createNode(startID, this.tileX, this.tileY, 0, null, null, BattalionEntity.PATH_FLAG.START);
    const queue = [startNode];
    const visitedCost = new Map();
    const typeCache = new Map();

    nodeMap.set(startID, startNode);
    visitedCost.set(startID, 0);

    while(queue.length > 0) {
        const node = mGetLowestCostNode(queue);
        const { cost, x, y, id } = node;

        if(cost > this.movementRange) {
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

            let flags = BattalionEntity.PATH_FLAG.NONE;
            let tileType = typeCache.get(neighborID);

            if(!tileType) {
                tileType = worldMap.getTileTypeObject(gameContext, neighborX, neighborY);
                typeCache.set(neighborID, tileType);
            }

            const tileCost = cost + this.getTileCost(gameContext, worldMap, tileType, neighborX, neighborY);

            if(tileCost <= this.movementRange) {
                const bestCost = visitedCost.get(neighborID);

                if(bestCost === undefined || tileCost < bestCost) {
                    const childNode = createNode(neighborID, neighborX, neighborY, tileCost, type, id, flags);

                    queue.push(childNode);
                    visitedCost.set(neighborID, tileCost);
                    nodeMap.set(neighborID, childNode);
                }
            } else if(!nodeMap.has(neighborID)) {
                flags |= BattalionEntity.PATH_FLAG.UNREACHABLE;

                const childNode = createNode(neighborID, neighborX, neighborY, tileCost, type, id, flags);

                nodeMap.set(neighborID, childNode);
            }
        }
    }
}

BattalionEntity.prototype.getBestPath = function(gameContext, nodes, targetX, targetY) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const path = [];

    if(!worldMap) {
        return path;
    }

    const index = worldMap.getIndex(targetX, targetY);
    const targetNode = nodes.get(index);

    if(!targetNode || !BattalionEntity.isNodeReachable(targetNode)) {
        return path;
    }

    let i = 0;
    let lastX = targetX;
    let lastY = targetY;
    let currentNode = nodes.get(targetNode.parent);

    while(currentNode !== undefined && i < BattalionEntity.MAX_MOVE_COST) {
        const { x, y, parent } = currentNode;
        const deltaX = lastX - x;
        const deltaY = lastY - y;

        path.push(BattalionEntity.createStep(deltaX, deltaY, lastX, lastY));

        i++;
        lastX = x;
        lastY = y;
        currentNode = nodes.get(parent);
    }

    return path;
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

BattalionEntity.prototype.isPathValid = function(gameContext, path) {
    if(path.length === 0) {
        return false;
    }

    const targetX = path[0].tileX;
    const targetY = path[0].tileY;
    const tileEntity = EntityHelper.getTileEntity(gameContext, targetX, targetY);

    if(tileEntity && tileEntity.isVisibleTo(gameContext, this.teamID)) {
        return false;
    }

    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    let currentX = this.tileX;
    let currentY = this.tileY;
    let totalCost = 0;

    for(let i = path.length - 1; i >= 0; i--) {
        const { deltaX, deltaY, tileX, tileY } = path[i];
        const totalDelta = Math.abs(deltaX) + Math.abs(deltaY);

        //Entities can only move one tile at a time.
        if(totalDelta > 1) {
            return false;
        }

        //Are tileX and tileY correct?
        if(currentX + deltaX !== tileX || currentY + deltaY !== tileY) {
            return false;
        }

        currentX += deltaX;
        currentY += deltaY;

        const index = worldMap.getIndex(currentX, currentY);

        //The target is out of bounds
        if(index === WorldMap.OUT_OF_BOUNDS) {
            return false;
        }

        const tileType = worldMap.getTileTypeObject(gameContext, tileX, tileY);

        totalCost += this.getTileCost(gameContext, worldMap, tileType, tileX, tileY);

        if(totalCost > this.movementRange) {
            return false;
        }
    }

    return true;
}

BattalionEntity.prototype.getTerrainTypes = function(gameContext) {
    const { world, typeRegistry } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const types = [];
    const tags = new Set();

    if(!worldMap) {
        return types;
    }

    const startX = this.tileX;
    const startY = this.tileY;
    const endX = startX + this.config.dimX;
    const endY = startY + this.config.dimY;

    for(let i = startY; i < endY; i++) {
        for(let j = startX; j < endX; j++) {
            const terrainTypes = worldMap.getTerrainTypes(gameContext, j, i);

            for(let i = 0; i < terrainTypes.length; i++) {
                tags.add(terrainTypes[i]);
            }
        }
    }

    for(const typeID of tags) {
        types.push(typeRegistry.getTerrainType(typeID));
    }

    return types;
}

BattalionEntity.prototype.canTarget = function(gameContext, target) {
    if(this.isDead() || target.isDead()) {
        return false;
    }

    //Stealth check. Cloaked units cannot be attacked.
    if(target.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
        return false;
    }

    if(!this.isRangeEnough(gameContext, target)) {
        return false;
    }

    const targetMove = target.config.movementType;

    //Flight units can only be attacked with skysweeper.
    if(targetMove === TypeRegistry.MOVEMENT_TYPE.FLIGHT && !this.hasTrait(TypeRegistry.TRAIT_TYPE.SKYSWEEPER)) {
        return false;
    }

    //Seabound entities can only attack RUDDER/HEAVY_RUDDER.
    if(this.hasTrait(TypeRegistry.TRAIT_TYPE.SEABOUND)) {
        if(targetMove !== TypeRegistry.MOVEMENT_TYPE.RUDDER && targetMove !== TypeRegistry.MOVEMENT_TYPE.HEAVY_RUDDER) {
            return false;
        }
    }

    //Special submarine case. Submarines can only be targeted by DEPTH_CHARGE.
    if(target.hasTrait(TypeRegistry.TRAIT_TYPE.SUBMERGED) && !this.hasTrait(TypeRegistry.TRAIT_TYPE.DEPTH_CHARGE)) {
        return false;
    }

    const rangeType = this.getRangeType();

    //Protected targets cannot be shot.
    if(rangeType === BattalionEntity.RANGE_TYPE.RANGE) {
        if(target.isProtectedFromRange(gameContext)) {
            return false;
        }
    } else if(rangeType === BattalionEntity.RANGE_TYPE.HYBRID) {
        //Special case for entities with MIN_RANGE of 1 and MAX_RANGE of n.
        if(!this.isNextToEntity(target) && target.isProtectedFromRange(gameContext)) {
            return false;
        }
    }

    //Streamblast and clean shot entities can only attack in a direct lane.
    if(!this.isAxisMeeting(target)) {
        if(this.hasTrait(TypeRegistry.TRAIT_TYPE.STREAMBLAST) || this.hasTrait(TypeRegistry.TRAIT_TYPE.CLEAN_SHOT)) {
            return false;
        }
    }

    return true;
}

BattalionEntity.prototype.isProtectedFromRange = function(gameContext) {
    const { world, typeRegistry } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    const startX = this.tileX;
    const startY = this.tileY;
    const endX = startX + this.config.dimX;
    const endY = startY + this.config.dimY;

    for(let i = startY; i < endY; i++) {
        for(let j = startX; j < endX; j++) {
            const terrainTypes = worldMap.getTerrainTypes(gameContext, j, i);

            for(let i = 0; i < terrainTypes.length; i++) {
                const { rangeGuard } = typeRegistry.getTerrainType(terrainTypes[i])

                if(rangeGuard) {
                    return true;
                }
            }
        }
    }

    return false;
}

BattalionEntity.prototype.isAllowedToCounter = function(target) {
    //Special attack types cannot counter and cannot be countered.
    if(this.getAttackType() !== BattalionEntity.ATTACK_TYPE.REGULAR || target.getAttackType() !== BattalionEntity.ATTACK_TYPE.REGULAR) {
        return false;
    }

    if(this.hasTrait(TypeRegistry.TRAIT_TYPE.BLIND_SPOT) || this.hasTrait(TypeRegistry.TRAIT_TYPE.SELF_DESTRUCT)) {
        return false;
    }

    //Target should be the previous attacker.
    const targetID = target.getID();

    if(this.lastAttacker !== targetID) {
        return false;
    }

    if(target.hasTrait(TypeRegistry.TRAIT_TYPE.TANK_HUNTER) && this.config.movementType === TypeRegistry.MOVEMENT_TYPE.TRACKED) {
        return false;
    }

    if(target.hasTrait(TypeRegistry.TRAIT_TYPE.MOBILE_BATTERY)) {
        const rangeType = this.getRangeType();

        if(rangeType === BattalionEntity.RANGE_TYPE.RANGE) {
            return false;
        } else if(rangeType === BattalionEntity.RANGE_TYPE.HYBRID) {
            if(!this.isNextToEntity(target)) {
                return false;
            }
        }
    }

    return true;
}

BattalionEntity.prototype.getDamageAmplifier = function(gameContext, target, attackType) {
    const { world, typeRegistry } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const targetArmor = target.config.armorType;
    const targetMove = target.config.movementType;
    const targetX = target.tileX;
    const targetY = target.tileY;

    let armorFactor = 1;
    let terrainFactor = 1;
    let logisticFactor = 1;
    let healthFactor = 1;
    let damageAmplifier = 1;

    if(!this.hasTrait(TypeRegistry.TRAIT_TYPE.INDOMITABLE)) {
        healthFactor = this.health / this.maxHealth;

        if(healthFactor > 1) {
            healthFactor = 1;
        }
    }
    
    //Morale factor.
    damageAmplifier *= this.moraleAmplifier;

    //Armor factor.
    if(!this.hasTrait(TypeRegistry.TRAIT_TYPE.ARMOR_PIERCE)) {
        const weaponType = typeRegistry.getWeaponType(this.config.weaponType);

        armorFactor *= weaponType.armorResistance[targetArmor] ?? 1;
    }

    //Logistic factor. Applies only to non-commandos.
    if(!this.hasTrait(TypeRegistry.TRAIT_TYPE.COMMANDO)) {        
        logisticFactor = worldMap.getLogisticFactor(gameContext, this.tileX, this.tileY);
    }

    //Target tile.
    const { terrain } = worldMap.getTileTypeObject(gameContext, targetX, targetY);

    for(let i = 0; i < terrain.length; i++) {
        const { protection } = typeRegistry.getTerrainType(terrain[i]);

        //Terrain factor.
        terrainFactor *= protection[targetMove] ?? 1;
    }

    //Attacker traits.
    for(let i = 0; i < this.config.traits.length; i++) {
        const { moveDamage, armorDamage } = typeRegistry.getTraitType(this.config.traits[i]);
        
        //Move factor.
        damageAmplifier *= moveDamage[targetMove] ?? 1;

        //Armor factor.
        damageAmplifier *= armorDamage[targetArmor] ?? 1;
    }

    //Steer trait. Reduces damage received by STEER for each tile the target can travel further. Up to STEER_MAX_REDUCTION.
    if(target.hasTrait(TypeRegistry.TRAIT_TYPE.STEER)) {
        if(this.config.movementType === TypeRegistry.MOVEMENT_TYPE.RUDDER || this.config.movementType === TypeRegistry.MOVEMENT_TYPE.HEAVY_RUDDER) {
            const deltaRange = target.movementRange - this.movementRange;

            if(deltaRange > 0) {
                const steerAmplifier = 1 - (deltaRange * DAMAGE_AMPLIFIER.STEER);

                if(steerAmplifier < DAMAGE_AMPLIFIER.STEER_MAX_REDUCTION) {
                    damageAmplifier *= DAMAGE_AMPLIFIER.STEER_MAX_REDUCTION;
                } else {
                    damageAmplifier *= steerAmplifier;
                }
            }
        }
    }

    switch(attackType) {
        case AttackAction.ATTACK_TYPE.INITIATE: {
            //Schwerpunkt factor.
            if(this.hasTrait(TypeRegistry.TRAIT_TYPE.SCHWERPUNKT) && targetMove === TypeRegistry.MOVEMENT_TYPE.FOOT) {
                damageAmplifier *= DAMAGE_AMPLIFIER.SCHWERPUNKT;
            }

            //Stealth factor.
            if(this.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
                damageAmplifier *= DAMAGE_AMPLIFIER.STEALTH;
            }

            break;
        }
        case AttackAction.ATTACK_TYPE.COUNTER: {
            if(this.hasTrait(TypeRegistry.TRAIT_TYPE.SLUGGER)) {
                healthFactor = 1;
            }

            break;
        }
        default:  {
            console.warn("Unsupported attack type!", attackType);
            break;
        }
    }

    damageAmplifier *= armorFactor;
    damageAmplifier *= terrainFactor;
    damageAmplifier *= logisticFactor;
    damageAmplifier *= healthFactor;

    return damageAmplifier;
}

BattalionEntity.prototype.getDamage = function(gameContext, target, attackType, damageFlags) {
    const targetMove = target.config.movementType;
    const damageAmplifier = this.getDamageAmplifier(gameContext, target, attackType);
    let damage = this.damage * damageAmplifier;

	if(
		target.hasTrait(TypeRegistry.TRAIT_TYPE.CEMENTED_STEEL_ARMOR) &&
		!this.hasTrait(TypeRegistry.TRAIT_TYPE.SUPPLY_DISTRIBUTION) &&
		!this.hasTrait(TypeRegistry.TRAIT_TYPE.CAVITATION_EXPLOSION)
	) {
		damage -= 20;
	}

    if(damage < 0) {
		damage = 0;
	}

    //Unknown calculation.
	if(
        damage > 25 &&
        targetMove === TypeRegistry.MOVEMENT_TYPE.FLIGHT &&
        !this.hasTrait(TypeRegistry.TRAIT_TYPE.ANTI_AIR)
    ) {
		damage = 25;
	}

    if(
        attackType === AttackAction.ATTACK_TYPE.INITIATE &&
        this.hasTrait(TypeRegistry.TRAIT_TYPE.SUPPLY_DISTRIBUTION)
    ) {
        damage *= -1;
    }

    return damage;
}

BattalionEntity.prototype.playSound = function(gameContext, soundType) {
    const { client } = gameContext;
    const { soundPlayer } = client;
    let soundID = this.config.sounds[soundType];

    if(!soundID) {
        soundID = BattalionEntity.DEFAULT_SOUNDS[soundType];
    }

    if(soundID) {
        soundPlayer.play(soundID);
    }
}

BattalionEntity.prototype.bufferSounds = function(gameContext) {
    const { client } = gameContext;
    const { soundPlayer } = client;

    for(const soundName in this.config.sounds) {
        const sound = this.config.sounds[soundName];

        if(Array.isArray(sound)) {
            for(let i = 0; i < sound.length; i++) {
                soundPlayer.bufferAudio(sound[i]);
            }
        } else {
            soundPlayer.bufferAudio(sound);
        }
    }
}

BattalionEntity.prototype.bufferSprites = function(gameContext) {
    const spriteNames = Object.values(BattalionEntity.SPRITE_TYPE);

    for(const spriteName of spriteNames) {
        const spriteID = this.config.sprites[spriteName];

        if(spriteID) {
            this.sprite.preload(gameContext, spriteID);
        }
    }
}

BattalionEntity.prototype.isAxisMeeting = function(target) {
    const { tileX, tileY } = target;
    const deltaX = Math.abs(this.tileX - tileX);
    const deltaY = Math.abs(this.tileY - tileY);

    return deltaX === 0 || deltaY === 0;
}

BattalionEntity.prototype.getDistanceToTile = function(tileX, tileY) {
    const deltaX = Math.abs(this.tileX - tileX);
    const deltaY = Math.abs(this.tileY - tileY);

    return deltaX + deltaY;
}

BattalionEntity.prototype.getDistanceToEntity = function(entity) {
    const entityX = entity.tileX;
    const entityY = entity.tileY;
    const distance = this.getDistanceToTile(entityX, entityY);
    
    return distance;
}

BattalionEntity.prototype.isNextToTile = function(tileX, tileY) {
    return this.getDistanceToTile(tileX, tileY) === 1;
}

BattalionEntity.prototype.isNextToEntity = function(entity) {
    return this.getDistanceToEntity(entity) === 1;
}

BattalionEntity.prototype.cloakInstant = function() {
    if(!this.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
        this.sprite.setOpacity(0);
        this.setFlag(BattalionEntity.FLAG.IS_CLOAKED);
    }
}

BattalionEntity.prototype.uncloakInstant = function() {
    if(this.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
        this.sprite.setOpacity(1);
        this.removeFlag(BattalionEntity.FLAG.IS_CLOAKED);
    }
}

BattalionEntity.prototype.setOpacity = function(opacity) {
    this.sprite.setOpacity(opacity);
}

BattalionEntity.prototype.canUncloak = function() {
    return this.hasFlag(BattalionEntity.FLAG.IS_CLOAKED);
}

BattalionEntity.prototype.canCloak = function() {
    return !this.hasFlag(BattalionEntity.FLAG.IS_CLOAKED) && this.hasTrait(TypeRegistry.TRAIT_TYPE.STEALTH);
}

BattalionEntity.prototype.canCloakAt = function(gameContext, tileX, tileY) {
    if(!this.canCloak()) {
        return false;
    }

    const worldMap = gameContext.getActiveMap();
    const jammer = worldMap.getJammer(tileX, tileY);
    const cloakFlags = this.getCloakFlags();

    if(jammer.isJammed(gameContext, this.teamID, cloakFlags)) {
        return false;
    }

    const nearbyEntities = EntityHelper.getEntitiesAround(gameContext, tileX, tileY);

    for(let i = 0; i < nearbyEntities.length; i++) {
        if(!this.isAllyWith(gameContext, nearbyEntities[i])) {
            return false;
        }
    }

    return true;
}

BattalionEntity.prototype.canCloakAtSelf = function(gameContext) {
    return this.canCloakAt(gameContext, this.tileX, this.tileY);
}

BattalionEntity.prototype.canAttack = function() {
    return this.damage !== 0 && this.config.weaponType !== TypeRegistry.WEAPON_TYPE.NONE;
}

BattalionEntity.prototype.canMove = function() {
    return this.movementRange !== 0 && this.config.movementType !== TypeRegistry.MOVEMENT_TYPE.STATIONARY;
}

BattalionEntity.prototype.canAct = function() {
    return !this.hasFlag(BattalionEntity.FLAG.HAS_ATTACKED | BattalionEntity.FLAG.HAS_MOVED);
}

BattalionEntity.prototype.getCloakFlags = function() {
    if(this.hasTrait(TypeRegistry.TRAIT_TYPE.STEALTH)) {
        if(this.hasTrait(TypeRegistry.TRAIT_TYPE.SUBMERGED)) {
            return JammerField.FLAG.SONAR;
        }

        return JammerField.FLAG.RADAR;
    }

    return JammerField.FLAG.NONE;
}

BattalionEntity.prototype.getUncloakFlags = function() {
    if(this.hasTrait(TypeRegistry.TRAIT_TYPE.STEALTH)) {
        if(this.hasTrait(TypeRegistry.TRAIT_TYPE.SUBMERGED)) {
            return JammerField.FLAG.SONAR;
        }

        return JammerField.FLAG.RADAR;
    }

    return JammerField.FLAG.NONE;
}

BattalionEntity.prototype.getUncloakedEntities = function(gameContext, targetX, targetY) {
    const { world } = gameContext;
    const { entityManager } = world;
    const worldMap = gameContext.getActiveMap();
    const jammerFlags = this.getJammerFlags();
    const searchRange = this.config.jammerRange > 1 && jammerFlags !== JammerField.FLAG.NONE ? this.config.jammerRange : 1;
    const uncloakedEntities = [];

    worldMap.fill2DGraph(targetX, targetY, searchRange, (tileX, tileY) => {
        const entityID = worldMap.getTopEntity(tileX, tileY);
        const entity = entityManager.getEntity(entityID);
        
        if(entity) {
            const distance = entity.getDistanceToTile(targetX, targetY);

            if(distance === 1) {
                if(!entity.isVisibleTo(gameContext, this.teamID)) {
                    uncloakedEntities.push(entity);
                }
            } else if(jammerFlags !== JammerField.FLAG.NONE) {
                const uncloakFlags = entity.getUncloakFlags();

                if((uncloakFlags & jammerFlags) === uncloakFlags) {
                    if(!entity.isVisibleTo(gameContext, this.teamID)) {
                        uncloakedEntities.push(entity);
                    }
                }
            }
        }
    });

    return uncloakedEntities;
}

BattalionEntity.prototype.mInterceptPath = function(gameContext, path) {
    let elementsToDelete = path.length;

    for(let i = path.length - 1; i >= 0; i--) {
        const { tileX, tileY } = path[i];
        const entity = EntityHelper.getTileEntity(gameContext, tileX, tileY);

        if(!entity) {
            elementsToDelete = i;
        } else if(!entity.isVisibleTo(gameContext, this.teamID)) {
            path.splice(0, elementsToDelete);

            if(elementsToDelete !== i + 1) {
                return BattalionEntity.INTERCEPT.ILLEGAL;
            }

            return BattalionEntity.INTERCEPT.VALID;
        }
    }

    return BattalionEntity.INTERCEPT.NONE;
}

BattalionEntity.prototype.isSelectable = function() {
    return this.canAct() && !this.isDead();
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
    if(this.transportID !== null) {
        const { world } = gameContext;
        const { entityManager } = world;
        const transportType = entityManager.getEntityType(this.transportID);
        const previousHealthFactor = this.health / this.maxHealth;

        this.loadConfig(transportType);
        this.setHealth(this.maxHealth * previousHealthFactor);
        this.playIdle(gameContext);
        this.transportID = null;
    }
}

BattalionEntity.prototype.toTransport = function(gameContext, transportType) {
    if(this.transportID === null) {
        const { world } = gameContext;
        const { entityManager } = world;
        const previousHealthFactor = this.health / this.maxHealth;
        let transportConfig = null;

        switch(transportType) {
            case BattalionEntity.TRANSPORT_TYPE.BARGE: {
                transportConfig = entityManager.getEntityType(TypeRegistry.ENTITY_TYPE.LEVIATHAN_BARGE);
                break;
            }
            case BattalionEntity.TRANSPORT_TYPE.PELICAN: {
                transportConfig = entityManager.getEntityType(TypeRegistry.ENTITY_TYPE.PELICAN_TRANSPORT);
                break;
            }
            case BattalionEntity.TRANSPORT_TYPE.STORK: {
                transportConfig = entityManager.getEntityType(TypeRegistry.ENTITY_TYPE.STORK_TRANSPORT);
                break;
            }
            default: {
                transportConfig = entityManager.getEntityType(TypeRegistry.ENTITY_TYPE.LEVIATHAN_BARGE);
                break;
            }
        }

        this.transportID = this.config.id;
        this.loadConfig(transportConfig);
        this.setHealth(this.maxHealth * previousHealthFactor);
        this.playIdle(gameContext);
    }
}

BattalionEntity.prototype.getRangeType = function() {
    if(this.config.weaponType === TypeRegistry.WEAPON_TYPE.NONE) {
        return BattalionEntity.RANGE_TYPE.NONE;
    }

    if(this.config.maxRange > 1) {
        if(this.config.minRange === 1 && BattalionEntity.HYBRID_ENABLED) {
            return BattalionEntity.RANGE_TYPE.HYBRID;
        }

        return BattalionEntity.RANGE_TYPE.RANGE;
    }

    if(this.config.minRange === 1) {
        return BattalionEntity.RANGE_TYPE.MELEE;
    }

    return BattalionEntity.RANGE_TYPE.NONE;
}

BattalionEntity.prototype.isJammer = function() {
    return this.config.jammerRange > 0 && this.getJammerFlags() !== JammerField.FLAG.NONE;
}

BattalionEntity.prototype.getJammerFlags = function() {
    let flags = JammerField.FLAG.NONE;

    if(this.hasTrait(TypeRegistry.TRAIT_TYPE.JAMMER)) {
        flags |= JammerField.FLAG.RADAR;
        flags |= JammerField.FLAG.AIRSPACE_BLOCKED;
    }

    if(this.hasTrait(TypeRegistry.TRAIT_TYPE.SONAR)) {
        flags |= JammerField.FLAG.SONAR;
    }

    return flags;
}

BattalionEntity.prototype.placeJammer = function(gameContext) {
    const jammerType = this.getJammerFlags();

    if(jammerType !== JammerField.FLAG.NONE) {
        const worldMap = gameContext.getActiveMap();

        worldMap.fill2DGraph(this.tileX, this.tileY, this.config.jammerRange, (tileX, tileY) => {
            worldMap.addJammer(tileX, tileY, this.teamID, jammerType);
        });
    }
}

BattalionEntity.prototype.removeJammer = function(gameContext) {
    const jammerType = this.getJammerFlags();

    if(jammerType !== JammerField.FLAG.NONE) {
        const worldMap = gameContext.getActiveMap();

        worldMap.fill2DGraph(this.tileX, this.tileY, this.config.jammerRange, (tileX, tileY) => {
            worldMap.removeJammer(tileX, tileY, this.teamID, jammerType);
        });
    }
}

BattalionEntity.prototype.wasAttackedBy = function(entityID) {
    return this.lastAttacker === entityID;
}

BattalionEntity.prototype.onInitialPlace = function(gameContext) {
    this.placeJammer(gameContext);
}

BattalionEntity.prototype.onDeath = function(gameContext) {
    this.removeJammer(gameContext);
}

BattalionEntity.prototype.onMoveStart = function(gameContext) {
    this.removeJammer(gameContext);
}

BattalionEntity.prototype.onMoveEnd = function(gameContext) {
    this.placeJammer(gameContext);
    this.setFlag(BattalionEntity.FLAG.HAS_MOVED);

    //TODO: After a move ended, this checks the tile for any properties like damage_on_land
    //TODO: Also add an attack after move. Move can carry an attack target, which gets put as "next", if not uncloaked by a stealth unit.
    const terrainTypes = this.getTerrainTypes(gameContext);
}

BattalionEntity.prototype.onAttackEnd = function(gameContext) {
    this.setFlag(BattalionEntity.FLAG.HAS_ATTACKED | BattalionEntity.FLAG.ELUSIVE_TRIGGERED);
}

BattalionEntity.prototype.onCounterEnd = function(gameContext) {
    this.lastAttacker = EntityManager.ID.INVALID;
}

BattalionEntity.prototype.onAttackReceived = function(gameContext, entityID) {
    if(entityID !== this.id) {
        this.lastAttacker = entityID;
    }
}

BattalionEntity.prototype.onTurnStart = function(gameContext) {
    this.lastAttacker = EntityManager.ID.INVALID;
    this.removeFlag(BattalionEntity.FLAG.HAS_MOVED | BattalionEntity.FLAG.HAS_ATTACKED);
    this.removeFlag(BattalionEntity.FLAG.BEWEGUNGSKRIEG_TRIGGERED | BattalionEntity.FLAG.ELUSIVE_TRIGGERED);
    //this.sprite.thaw();

    console.log("My turn started", this);
} 

BattalionEntity.prototype.onTurnEnd = function(gameContext) {
    this.lastAttacker = EntityManager.ID.INVALID;
    this.setFlag(BattalionEntity.FLAG.HAS_MOVED | BattalionEntity.FLAG.HAS_ATTACKED);
    //this.sprite.freeze();

    console.log("My turn ended", this);
}

BattalionEntity.prototype.triggerBewegungskrieg = function() {
    if(!this.hasFlag(BattalionEntity.FLAG.BEWEGUNGSKRIEG_TRIGGERED)) {
        this.removeFlag(BattalionEntity.FLAG.HAS_ATTACKED | BattalionEntity.FLAG.HAS_MOVED);
        this.setFlag(BattalionEntity.FLAG.BEWEGUNGSKRIEG_TRIGGERED);
    }
}

BattalionEntity.prototype.triggerElusive = function() {
    if(!this.hasFlag(BattalionEntity.FLAG.ELUSIVE_TRIGGERED)) {
        this.removeFlag(BattalionEntity.FLAG.HAS_MOVED);
        this.setFlag(BattalionEntity.FLAG.ELUSIVE_TRIGGERED);
    }
}

BattalionEntity.prototype.getOverheatDamage = function() {
    return this.maxHealth * OVERHEAT_DAMAGE;
}

BattalionEntity.prototype.getAbsorberHealth = function(damage) {
    const health = this.health + damage * ABSORBER_RATE;

    if(health > this.maxHealth) {
        return this.maxHealth;
    }

    return health;
}

BattalionEntity.prototype.getAOERange = function() {
    if(this.hasTrait(TypeRegistry.TRAIT_TYPE.JUDGEMENT)) {
        return 2;
    }

    return 1;
}

BattalionEntity.prototype.mTriggerInitiateTraits = function(totalDamage, resolver) {
    if(this.hasTrait(TypeRegistry.TRAIT_TYPE.SELF_DESTRUCT)) {
        resolver.add(this.id, 0);

    } else if(this.hasTrait(TypeRegistry.TRAIT_TYPE.OVERHEAT)) {
        const overheatDamage = this.getOverheatDamage();
        const overheatHealth = this.getHealthAfter(overheatDamage);

        resolver.add(this.id, overheatHealth);

    } else if(this.hasTrait(TypeRegistry.TRAIT_TYPE.ABSORBER)) {
        const absorberHealth = this.getAbsorberHealth(totalDamage);

        resolver.add(this.id, absorberHealth);
    }
}

BattalionEntity.prototype.mTriggerCounterTraits = function(totalDamage, resolver) {
    if(this.hasTrait(TypeRegistry.TRAIT_TYPE.OVERHEAT)) {
        const overheatDamage = this.getOverheatDamage();
        const overheatHealth = this.getHealthAfter(overheatDamage);

        resolver.add(this.id, overheatHealth);

    } else if(this.hasTrait(TypeRegistry.TRAIT_TYPE.ABSORBER)) {
        const absorberHealth = this.getAbsorberHealth(totalDamage);

        resolver.add(this.id, absorberHealth);
    }
}

BattalionEntity.prototype.mGetRegularDamage = function(gameContext, target, resolver) {
    const damage = this.getDamage(gameContext, target, AttackAction.ATTACK_TYPE.INITIATE, BattalionEntity.DAMAGE_FLAG.NONE);
    let totalDamage = damage;

    resolver.add(target.getID(), target.getHealthAfter(damage));

    if(this.hasTrait(TypeRegistry.TRAIT_TYPE.SHRAPNEL)) {
        const { tileX, tileY } = target;
        const direction = this.getDirectionTo(target);
        const targets = BattalionEntity.getLineTargets(gameContext, direction, tileX, tileY, SHRAPNEL_RANGE);

        for(let i = 0; i < targets.length; i++) {
            const target = targets[i];
            const damage = this.getDamage(gameContext, target, AttackAction.ATTACK_TYPE.INITIATE, BattalionEntity.DAMAGE_FLAG.NONE);

            resolver.add(target.getID(), target.getHealthAfter(damage));
            totalDamage += damage;
        }
    }

    return totalDamage;
}

BattalionEntity.prototype.mGetStreamblastDamage = function(gameContext, target, resolver) {
    const direction = this.getDirectionTo(target);
    const range = this.config.streamRange;
    const targets = BattalionEntity.getLineTargets(gameContext, direction, this.tileX, this.tileY, range);
    let totalDamage = 0;

    for(let i = 0; i < targets.length; i++) {
        const target = targets[i];
        const damage = this.getDamage(gameContext, target, AttackAction.ATTACK_TYPE.INITIATE, BattalionEntity.DAMAGE_FLAG.NONE);
        const remainingHealth = target.getHealthAfter(damage);
        const targetID = target.getID();

        resolver.add(targetID, remainingHealth);
        totalDamage += damage;
    }

    return totalDamage;
}

BattalionEntity.prototype.mGetAOEDamage = function(gameContext, target, resolver) {
    const { tileX, tileY } = target;
    const range = this.getAOERange();
    const targets = BattalionEntity.getAOETargets(gameContext, tileX, tileY, range);
    let totalDamage = 0;

    for(let i = 0; i < targets.length; i++) {
        const target = targets[i];
        const targetID = target.getID();

        if(targetID === this.id) {
            continue;
        }

        const damage = this.getDamage(gameContext, target, AttackAction.ATTACK_TYPE.INITIATE, BattalionEntity.DAMAGE_FLAG.NONE);
        const remainingHealth = target.getHealthAfter(damage);

        resolver.add(targetID, remainingHealth);
        totalDamage += damage;
    }

    return totalDamage;
}

BattalionEntity.prototype.mGetCounterResolutions = function(gameContext, target, resolver) {
    if(this.isAllowedToCounter(target) && this.canTarget(gameContext, target)) {
        const damage = this.getDamage(gameContext, target, AttackAction.ATTACK_TYPE.COUNTER, BattalionEntity.DAMAGE_FLAG.NONE);
        let totalDamage = damage;

        resolver.add(target.getID(), target.getHealthAfter(damage));

        if(this.hasTrait(TypeRegistry.TRAIT_TYPE.SHRAPNEL)) {
            const { tileX, tileY } = target;
            const direction = this.getDirectionTo(target);
            const targets = BattalionEntity.getLineTargets(gameContext, direction, tileX, tileY, SHRAPNEL_RANGE);

            for(let i = 0; i < targets.length; i++) {
                const target = targets[i];
                const damage = this.getDamage(gameContext, target, AttackAction.ATTACK_TYPE.INITIATE, BattalionEntity.DAMAGE_FLAG.NONE);

                resolver.add(target.getID(), target.getHealthAfter(damage));
                totalDamage += damage;
            }
        }

        this.mTriggerCounterTraits(totalDamage, resolver);
    }
}

BattalionEntity.prototype.mGetInitiateResolutions = function(gameContext, target, resolver) {
    if(this.canTarget(gameContext, target)) {
        let totalDamage = 0;

        switch(this.getAttackType()) {
            case BattalionEntity.ATTACK_TYPE.REGULAR: {
                totalDamage = this.mGetRegularDamage(gameContext, target, resolver);
                break;
            }
            case BattalionEntity.ATTACK_TYPE.DISPERSION: {
                totalDamage = this.mGetAOEDamage(gameContext, target, resolver);
                break;
            }
            case BattalionEntity.ATTACK_TYPE.STREAMBLAST: {
                totalDamage = this.mGetStreamblastDamage(gameContext, target, resolver);
                break;
            }
        }

        this.mTriggerInitiateTraits(totalDamage, resolver);
    }
}