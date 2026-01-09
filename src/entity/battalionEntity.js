import { Entity } from "../../engine/entity/entity.js";
import { EntityManager } from "../../engine/entity/entityManager.js";
import { WorldMap } from "../../engine/map/worldMap.js";
import { isRectangleRectangleIntersect } from "../../engine/math/math.js";
import { FloodFill } from "../../engine/pathfinders/floodFill.js";
import { JammerField } from "../map/jammerField.js";
import { TypeRegistry } from "../type/typeRegistry.js";
import { EntityType } from "../type/parsed/entityType.js";
import { createNode, mGetLowestCostNode } from "../systems/pathfinding.js";
import { getDirectionByDelta } from "../systems/direction.js";
import { TRAIT_CONFIG, ATTACK_TYPE, DIRECTION, PATH_FLAG, RANGE_TYPE, ATTACK_FLAG } from "../enums.js";
import { transportTypeToEntityType } from "../systems/transport.js";
import { getAreaEntities, getLineEntities } from "../systems/targeting.js";

export const BattalionEntity = function(id) {
    Entity.call(this, id, "");

    this.customID = null;
    this.customName = null;
    this.customDesc = null;
    this.config = null;
    this.health = 1;
    this.maxHealth = 1;
    this.damage = 0;
    this.moraleType = TypeRegistry.MORALE_TYPE.NONE;
    this.moraleAmplifier = 1;
    this.tileX = -1;
    this.tileY = -1;
    this.tileZ = -1;
    this.direction = DIRECTION.EAST;
    this.state = BattalionEntity.STATE.IDLE;
    this.teamID = null;
    this.transportID = null;
    this.lastAttacker = EntityManager.ID.INVALID;
    this.turns = 0;
}

BattalionEntity.HYBRID_ENABLED = false;

BattalionEntity.FLAG = {
    NONE: 0,
    IS_CLOAKED: 1 << 0,
    IS_SUBMERGED: 1 << 1,
    HAS_MOVED: 1 << 2,
    HAS_FIRED: 1 << 3,
    CAN_MOVE: 1 << 4,
    BEWEGUNGSKRIEG_TRIGGERED: 1 << 5,
    ELUSIVE_TRIGGERED: 1 << 6
};

BattalionEntity.STATE = {
    IDLE: 0,
    MOVE: 1,
    FIRE: 2,
    DEAD: 3
};

BattalionEntity.prototype = Object.create(Entity.prototype);
BattalionEntity.prototype.constructor = BattalionEntity;

BattalionEntity.prototype.onHealthUpdate = function() {}
BattalionEntity.prototype.onLoad = function(gameContext, data) {}

BattalionEntity.prototype.save = function() {
    return {
        "type": this.config.id,
        "flags": this.flags,
        "health": this.health,
        "maxHealth": this.maxHealth,
        "morale": this.moraleType,
        "id": this.customID,
        "tileX": this.tileX,
        "tileY": this.tileY,
        "tileZ": this.tileZ,
        "teamID": this.teamID,
        "transport": this.transportID,
        "direction": this.direction,
        "state": this.state,
        "name": this.customName,
        "desc": this.customDesc,
        "turns": this.turns
    };
}

BattalionEntity.prototype.load = function(gameContext, data) {
    this.flags = data.flags;
    this.maxHealth = data.maxHealth;
    this.moraleType = data.morale;
    this.tileZ = data.tileZ;
    this.transportID = data.transport;
    this.state = data.state;
    this.customID = data.id;
    this.turns = data.turns;
    
    this.setDirection(data.direction);
    this.setHealth(data.health);
    this.onLoad(gameContext, data);
}

BattalionEntity.prototype.loadConfig = function(config) {
    const { health, damage } = config;

    this.config = config;
    this.health = health;
    this.maxHealth = health;
    this.damage = damage;

    this.setHealth(this.health);
}

BattalionEntity.prototype.setCustomInfo = function(name, desc) {
    this.customName = name;
    this.customDesc = desc;
}

BattalionEntity.prototype.setCustomID = function(customID) {
    this.customID = customID;
}

BattalionEntity.prototype.getRangeType = function() {
    if(this.config.maxRange > 1) {
        if(this.config.minRange === 1 && BattalionEntity.HYBRID_ENABLED) {
            return RANGE_TYPE.HYBRID;
        }

        return RANGE_TYPE.RANGE;
    }

    if(this.config.minRange === 1) {
        return RANGE_TYPE.MELEE;
    }

    return RANGE_TYPE.NONE;
}

BattalionEntity.prototype.getAttackType = function() {
    if(this.hasTrait(TypeRegistry.TRAIT_TYPE.DISPERSION) || this.hasTrait(TypeRegistry.TRAIT_TYPE.JUDGEMENT)) {
        return ATTACK_TYPE.DISPERSION;
    }

    if(this.hasTrait(TypeRegistry.TRAIT_TYPE.STREAMBLAST)) {
        return ATTACK_TYPE.STREAMBLAST;
    }

    return ATTACK_TYPE.REGULAR;
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

BattalionEntity.prototype.getHealthAfterDamage = function(damage = 0) {
    const health = Math.floor(this.health - damage);

    if(health <= 0) {
        if(this.health > TRAIT_CONFIG.HEROIC_THRESHOLD && this.hasTrait(TypeRegistry.TRAIT_TYPE.HEROIC)) {
            return TRAIT_CONFIG.HEROIC_THRESHOLD;
        }

        return 0;
    }

    if(health >= this.maxHealth) {
        return this.maxHealth;
    }

    return health;
}

BattalionEntity.prototype.setHealth = function(health) {
    if(health < 0) {
        this.health = 0;
    } else {
        this.health = health;
    }

    this.onHealthUpdate();
}

BattalionEntity.prototype.hasTrait = function(traitID) {
    return this.config.hasTrait(traitID);
}

BattalionEntity.prototype.destroy = function() {
    this.isMarkedForDestroy = true;
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

BattalionEntity.prototype.lookAt = function(entity) {
    const direction = this.getDirectionTo(entity);

    return this.setDirection(direction);
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

BattalionEntity.prototype.takeTerrainDamage = function(gameContext) {
    const damage = this.getTerrainDamage(gameContext, this.tileX, this.tileY);
    const health = this.health - damage;

    this.setHealth(health);
}

BattalionEntity.prototype.getTerrainDamage = function(gameContext, tileX, tileY) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    const startX = tileX;
    const startY = tileY;
    const endX = startX + this.config.dimX;
    const endY = startY + this.config.dimY;
    let totalDamage = 0;

    for(let i = startY; i < endY; i++) {
        for(let j = startX; j < endX; j++) {
            const terrainTypes = worldMap.getTerrainTypes(gameContext, j, i);

            for(let i = 0; i < terrainTypes.length; i++) {
                const { damage } = terrainTypes[i];

                totalDamage += damage[this.config.movementType] ?? 0;
            }
        }
    }

    return totalDamage;
}

BattalionEntity.prototype.getTileCost = function(gameContext, worldMap, tileType, tileX, tileY) {
    const { world, typeRegistry } = gameContext;
    const { entityManager } = world;
    const { terrain, passability } = tileType;
    let tileCost = passability[this.config.movementType] ?? EntityType.MAX_MOVE_COST;

    if(tileCost >= EntityType.MAX_MOVE_COST) {
        return EntityType.MAX_MOVE_COST;
    }

    if(this.config.movementType === TypeRegistry.MOVEMENT_TYPE.FLIGHT && !this.hasTrait(TypeRegistry.TRAIT_TYPE.HIGH_ALTITUDE)) {
        const jammer = worldMap.getJammer(tileX, tileY);

        if(jammer.isJammed(gameContext, this.teamID, JammerField.FLAG.AIRSPACE_BLOCKED)) {
            return EntityType.MAX_MOVE_COST;
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
            tileCost += EntityType.MAX_MOVE_COST;
        }
    }

    if(tileCost < EntityType.MIN_MOVE_COST) {
        tileCost = EntityType.MIN_MOVE_COST;
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
                flags |= PATH_FLAG.UNREACHABLE;

                const childNode = createNode(neighborID, neighborX, neighborY, tileCost, type, id, flags);

                nodeMap.set(neighborID, childNode);
            }
        }
    }
}

BattalionEntity.prototype.canCapture = function(gameContext, tileX, tileY) {
    if(!this.hasTrait(TypeRegistry.TRAIT_TYPE.CONQUEROR)) {
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

    if(!building.hasTrait(TypeRegistry.TRAIT_TYPE.CAPTURABLE)) {
        return false;
    }

    return building.isCapturable(gameContext, this.teamID);
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

        const tileType = worldMap.getTileType(gameContext, tileX, tileY);

        totalCost += this.getTileCost(gameContext, worldMap, tileType, tileX, tileY);

        if(totalCost > this.config.movementRange) {
            return false;
        }
    }

    return true;
}

BattalionEntity.prototype.isPathValid = function(gameContext, path) {
    if(path.length === 0) {
        return false;
    }

    const { world } = gameContext;
    const targetX = path[0].tileX;
    const targetY = path[0].tileY;
    const tileEntity = world.getEntityAt(targetX, targetY);

    if(tileEntity && tileEntity.isVisibleTo(gameContext, this.teamID)) {
        return false;
    }

    return this.isPathWalkable(gameContext, path);
}

BattalionEntity.prototype.getTerrainTypes = function(gameContext) {
    const { world } = gameContext;
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
            const terrainTypes = worldMap.getTerrainTypes(gameContext, j, i);

            for(let i = 0; i < terrainTypes.length; i++) {
                const type = terrainTypes[i];
                const { id } = type;

                if(!tags.has(id)) {
                    types.push(type);
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
    switch(this.getRangeType()) {
        case RANGE_TYPE.RANGE: {
            //Protected targets cannot be shot.
            if(target.isProtectedFromRange(gameContext)) {
                return false;
            }

            break;
        }
        case RANGE_TYPE.HYBRID: {
            //Special case for entities with MIN_RANGE of 1 and MAX_RANGE of n.
            if(!this.isNextToEntity(target) && target.isProtectedFromRange(gameContext)) {
                return false;
            }

            break;
        }
    }

    //Streamblast and clean shot entities can only attack in a direct lane.
    if(!this.isAxisMeeting(target)) {
        if(this.hasTrait(TypeRegistry.TRAIT_TYPE.STREAMBLAST) || this.hasTrait(TypeRegistry.TRAIT_TYPE.CLEAR_SHOT)) {
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

    if(this.config.weaponType === TypeRegistry.WEAPON_TYPE.NONE) {
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
    if(!this.hasTrait(TypeRegistry.TRAIT_TYPE.SUPPLY_DISTRIBUTION)) {
        return false;
    }

    //Cannot heal enemies.
    if(!this.isAllyWith(gameContext, target)) {
        return false;
    }

    return true;
}

BattalionEntity.prototype.isProtectedFromRange = function(gameContext) {
    const { world } = gameContext;
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
                const { rangeGuard } = terrainTypes[i];

                if(rangeGuard) {
                    return true;
                }
            }
        }
    }

    return false;
}

BattalionEntity.prototype.isCounterValid = function(target) {
    //Only regular attackers can counter.
    if(this.getAttackType() !== ATTACK_TYPE.REGULAR || target.getAttackType() !== ATTACK_TYPE.REGULAR) {
        return false;
    }

    //Certain entities can never counter.
    if(this.hasTrait(TypeRegistry.TRAIT_TYPE.BLIND_SPOT) || this.hasTrait(TypeRegistry.TRAIT_TYPE.SELF_DESTRUCT)) {
        return false;
    }

    const targetID = target.getID();

    //Target should be the previous attacker.
    if(this.lastAttacker !== targetID) {
        return false;
    }

    //TANK_HUNTER disables TRACKED from countering.
    if(target.hasTrait(TypeRegistry.TRAIT_TYPE.TANK_HUNTER) && this.config.movementType === TypeRegistry.MOVEMENT_TYPE.TRACKED) {
        return false;
    }

    //MOBILE_BATTERY cannot be countered by ranged units.
    if(target.hasTrait(TypeRegistry.TRAIT_TYPE.MOBILE_BATTERY)) {
        switch(this.getRangeType()) {
            case RANGE_TYPE.RANGE: {
                return false;
            }
            case RANGE_TYPE.HYBRID: {
                if(!this.isNextToEntity(target)) {
                    return false;
                }

                break;
            }
        }
    }

    return true;
}

BattalionEntity.prototype.getHealAmplifier = function(gameContext) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    let healthFactor = 1;
    let damageAmplifier = 1;
    let logisticFactor = 1;

    if(!this.hasTrait(TypeRegistry.TRAIT_TYPE.INDOMITABLE)) {
        healthFactor = this.health / this.maxHealth;

        if(healthFactor > 1) {
            healthFactor = 1;
        }
    }

    if(!this.hasTrait(TypeRegistry.TRAIT_TYPE.COMMANDO)) {
        logisticFactor = worldMap.getLogisticFactor(gameContext, this.tileX, this.tileY);
    }

    damageAmplifier *= this.moraleAmplifier;
    damageAmplifier *= healthFactor;
    damageAmplifier *= logisticFactor;

    return damageAmplifier;
}

BattalionEntity.prototype.getAttackAmplifier = function(gameContext, target, damageFlags) {
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

        if(healthFactor >= 1) {
            healthFactor = 1;
        }
    }
    
    if(healthFactor >= 1 && this.hasTrait(TypeRegistry.TRAIT_TYPE.ANNIHILATE)) {
        damageAmplifier *= TRAIT_CONFIG.ANNIHILATE_DAMAGE;
    }

    if(target.isAtFullHealth() && this.hasTrait(TypeRegistry.TRAIT_TYPE.BULLDOZE)) {
        damageAmplifier *= TRAIT_CONFIG.BULLDOZE_DAMAGE;
    }

    //Logistic factor. Applies only to non-commandos.
    if(!this.hasTrait(TypeRegistry.TRAIT_TYPE.COMMANDO)) {
        logisticFactor = worldMap.getLogisticFactor(gameContext, this.tileX, this.tileY);
    }

    //Armor factor.
    if(!this.hasTrait(TypeRegistry.TRAIT_TYPE.ARMOR_PIERCE)) {
        const weaponType = typeRegistry.getWeaponType(this.config.weaponType);

        armorFactor *= weaponType.armorResistance[targetArmor] ?? 1;
    }

    //Target tile.
    const { terrain } = worldMap.getTileType(gameContext, targetX, targetY);

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
            const deltaRange = target.config.movementRange - this.config.movementRange;

            if(deltaRange > 0) {
                const steerAmplifier = 1 - (deltaRange * TRAIT_CONFIG.STEER_REDUCTION);

                if(steerAmplifier < TRAIT_CONFIG.STEER_MAX_REDUCTION) {
                    damageAmplifier *= TRAIT_CONFIG.STEER_MAX_REDUCTION;
                } else {
                    damageAmplifier *= steerAmplifier;
                }
            }
        }
    }

    //If it's not a counter it must be a normal attack.
    if(damageFlags & ATTACK_FLAG.COUNTER) {
        if(this.hasTrait(TypeRegistry.TRAIT_TYPE.SLUGGER)) {
            healthFactor = 1;
        }
    } else {
        //Blitz factor.
        if(this.hasTrait(TypeRegistry.TRAIT_TYPE.BLITZ)) {
            damageAmplifier *= TRAIT_CONFIG.BLITZ_MULTIPLIER;
        }

        //Schwerpunkt factor.
        if(this.hasTrait(TypeRegistry.TRAIT_TYPE.SCHWERPUNKT) && targetMove === TypeRegistry.MOVEMENT_TYPE.FOOT) {
            damageAmplifier *= TRAIT_CONFIG.SCHWERPUNKT_MULTIPLIER;
        }

        //Stealth factor.
        if(this.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
            damageAmplifier *= TRAIT_CONFIG.STEALTH_MULTIPLIER;
        }
    }

    if(damageFlags & ATTACK_FLAG.SHRAPNEL) {
        damageAmplifier *= TRAIT_CONFIG.SHRAPNEL_DAMAGE;
    }

    damageAmplifier *= this.moraleAmplifier;
    damageAmplifier *= armorFactor;
    damageAmplifier *= terrainFactor;
    damageAmplifier *= logisticFactor;
    damageAmplifier *= healthFactor;

    return damageAmplifier;
}

BattalionEntity.prototype.getAttackDamage = function(gameContext, target, damageFlags) {
    const targetMove = target.config.movementType;
    const damageAmplifier = this.getAttackAmplifier(gameContext, target, damageFlags);
    let damage = this.damage * damageAmplifier;

	if(target.hasTrait(TypeRegistry.TRAIT_TYPE.CEMENTED_STEEL_ARMOR) && !this.hasTrait(TypeRegistry.TRAIT_TYPE.CAVITATION_EXPLOSION)) {
		damage -= TRAIT_CONFIG.CEMENTED_STEEL_ARMOR_REDUCTION;
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

    return damage;
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

BattalionEntity.prototype.canUncloak = function() {
    return this.hasFlag(BattalionEntity.FLAG.IS_CLOAKED);
}

BattalionEntity.prototype.canCloak = function() {
    return !this.hasFlag(BattalionEntity.FLAG.IS_CLOAKED) && this.hasTrait(TypeRegistry.TRAIT_TYPE.STEALTH);
}

BattalionEntity.prototype.canCloakAt = function(gameContext, tileX, tileY) {
    const { world } = gameContext;
    const { mapManager } = world;

    if(!this.canCloak()) {
        return false;
    }

    //UNFAIR entities ignore jammers.
    if(!this.hasTrait(TypeRegistry.TRAIT_TYPE.UNFAIR)) {
        const worldMap = mapManager.getActiveMap();
        const jammer = worldMap.getJammer(tileX, tileY);
        const cloakFlag = this.getCloakFlag();

        if(jammer.isJammed(gameContext, this.teamID, cloakFlag)) {
            return false;
        }
    }

    const nearbyEntities = world.getEntitiesAround(tileX, tileY);

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

BattalionEntity.prototype.canMove = function() {
    return this.config.movementRange !== 0 && this.config.movementType !== TypeRegistry.MOVEMENT_TYPE.STATIONARY;
}

BattalionEntity.prototype.canAct = function() {
    return (this.flags & BattalionEntity.FLAG.CAN_MOVE) && !(this.flags & BattalionEntity.FLAG.HAS_FIRED);
}

BattalionEntity.prototype.getCloakFlag = function() {
    //The returned flags need to be unset in a jammer field, otherwise cloaking will not work.
    if(this.hasTrait(TypeRegistry.TRAIT_TYPE.STEALTH)) {
        if(this.hasTrait(TypeRegistry.TRAIT_TYPE.SUBMERGED)) {
            return JammerField.FLAG.SONAR;
        }

        return JammerField.FLAG.RADAR;
    }

    return JammerField.FLAG.NONE;
}

BattalionEntity.prototype.getUncloakedEntitiesAtSelf = function(gameContext) {
    return this.getUncloakedEntities(gameContext, this.tileX, this.tileY);
}

BattalionEntity.prototype.getUncloakedEntities = function(gameContext, targetX, targetY) {
    const { world } = gameContext;
    const { mapManager, entityManager } = world;
    const worldMap = mapManager.getActiveMap();
    const jammerFlags = this.getJammerFlags();
    const searchRange = jammerFlags !== JammerField.FLAG.NONE ? this.config.jammerRange : 1;
    const uncloakedEntities = [];
    let shouldSelfUncloak = false;

    worldMap.fill2DGraph(targetX, targetY, searchRange, (tileX, tileY, tileD) => {
        const entityID = worldMap.getTopEntity(tileX, tileY);
        const entity = entityManager.getEntity(entityID);

        if(entity) {
            const distance = entity.getDistanceToTile(targetX, targetY);

            //ALWAYS uncloak neighbors.
            if(distance === 1) {
                //isVisibleTo check, but split up.
                if(!this.isAllyWith(gameContext, entity)) {
                    if(entity.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
                        uncloakedEntities.push(entity);
                    }

                    //Always uncloak next to an enemy.
                    shouldSelfUncloak = true;
                }
            } else if(jammerFlags !== JammerField.FLAG.NONE) {
                const cloakFlag = entity.getCloakFlag();

                if(jammerFlags & cloakFlag) {
                    if(!entity.hasTrait(TypeRegistry.TRAIT_TYPE.UNFAIR) && !entity.isVisibleTo(gameContext, this.teamID)) {
                        uncloakedEntities.push(entity);
                    }
                }
            }
        }
    });

    //Self uncloaking logic.
    if(this.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
        if(shouldSelfUncloak) {
            uncloakedEntities.push(this);
        } else {
            //Jammer check for self.
            const jammer = worldMap.getJammer(targetX, targetY);
            const cloakFlag = this.getCloakFlag();

            if(jammer.isJammed(gameContext, this.teamID, cloakFlag)) {
                uncloakedEntities.push(this);
            }
        }
    }

    return uncloakedEntities;
}

BattalionEntity.prototype.isSelectable = function() {
    return !this.isDead() && !this.hasFlag(BattalionEntity.FLAG.HAS_FIRED) && this.hasFlag(BattalionEntity.FLAG.CAN_MOVE);
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
        const { typeRegistry } = gameContext;
        const transportType = typeRegistry.getEntityType(this.transportID);
        const previousHealthFactor = this.health / this.maxHealth;

        this.loadConfig(transportType);
        this.setHealth(this.maxHealth * previousHealthFactor);
        this.playIdle(gameContext);
        this.transportID = null;
    }
}

BattalionEntity.prototype.toTransport = function(gameContext, transportType) {
    if(this.transportID === null) {
        const { typeRegistry } = gameContext;
        const previousHealthFactor = this.health / this.maxHealth;
        const entityTypeID = transportTypeToEntityType(transportType);
        const transportConfig = typeRegistry.getEntityType(entityTypeID);

        this.transportID = this.config.id;
        this.loadConfig(transportConfig);
        this.setHealth(this.maxHealth * previousHealthFactor);
        this.playIdle(gameContext);
    }
}

BattalionEntity.prototype.isJammer = function() {
    return this.config.jammerRange > 0 && this.getJammerFlags() !== JammerField.FLAG.NONE;
}

BattalionEntity.prototype.getJammerFlags = function() {
    let flags = JammerField.FLAG.NONE;

    //JAMMER also blocks airspace traffic.
    if(this.hasTrait(TypeRegistry.TRAIT_TYPE.JAMMER)) {
        flags |= JammerField.FLAG.RADAR;
        flags |= JammerField.FLAG.AIRSPACE_BLOCKED;
    }

    if(this.hasTrait(TypeRegistry.TRAIT_TYPE.SONAR)) {
        flags |= JammerField.FLAG.SONAR;
    }

    return flags;
}

BattalionEntity.prototype.clearLastAttacker = function() {
    this.lastAttacker = EntityManager.ID.INVALID;
}

BattalionEntity.prototype.setLastAttacker = function(entityID) {
    if(entityID !== this.id) {
        this.lastAttacker = entityID;
    }
}

BattalionEntity.prototype.onTurnStart = function() {
    this.clearFlag(BattalionEntity.FLAG.HAS_MOVED | BattalionEntity.FLAG.HAS_FIRED);
    this.clearFlag(BattalionEntity.FLAG.BEWEGUNGSKRIEG_TRIGGERED | BattalionEntity.FLAG.ELUSIVE_TRIGGERED);
    this.setFlag(BattalionEntity.FLAG.CAN_MOVE);
    this.clearLastAttacker();
    this.turns++;
} 

BattalionEntity.prototype.onTurnEnd = function() {
    this.setFlag(BattalionEntity.FLAG.HAS_MOVED | BattalionEntity.FLAG.HAS_FIRED);
    this.clearFlag(BattalionEntity.FLAG.CAN_MOVE);
    this.clearLastAttacker();
}

BattalionEntity.prototype.triggerBewegungskrieg = function() {
    if(!this.hasFlag(BattalionEntity.FLAG.BEWEGUNGSKRIEG_TRIGGERED)) {
        //Clear HAS_FIRED and HAS_MOVED to allow MoveAction to potentially queue again.
        this.clearFlag(BattalionEntity.FLAG.HAS_FIRED | BattalionEntity.FLAG.HAS_MOVED);
        this.setFlag(BattalionEntity.FLAG.BEWEGUNGSKRIEG_TRIGGERED | BattalionEntity.FLAG.CAN_MOVE);
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

BattalionEntity.prototype.getAbsorberHealth = function(damage) {
    const health = this.health + damage * TRAIT_CONFIG.ABSORBER_RATE;

    if(health > this.maxHealth) {
        return this.maxHealth;
    }

    return health;
}

BattalionEntity.prototype.mResolveAttackTraits = function(resolver) {
    if(this.hasTrait(TypeRegistry.TRAIT_TYPE.SELF_DESTRUCT)) {
        resolver.add(this.id, 0);

    } else if(this.hasTrait(TypeRegistry.TRAIT_TYPE.OVERHEAT)) {
        const overheatDamage = this.getOverheatDamage();
        const overheatHealth = this.getHealthAfterDamage(overheatDamage);

        resolver.add(this.id, overheatHealth);

    } else if(this.hasTrait(TypeRegistry.TRAIT_TYPE.ABSORBER)) {
        const { totalDamage } = resolver;
        const absorberHealth = this.getAbsorberHealth(totalDamage);

        resolver.add(this.id, absorberHealth);
    }
}

BattalionEntity.prototype.mResolveShrapnel = function(gameContext, target, damageFlags, resolver) {
    const { tileX, tileY } = target;
    const direction = this.getDirectionTo(target);
    const targets = getLineEntities(gameContext, direction, tileX, tileY, TRAIT_CONFIG.SHRAPNEL_RANGE);
    const flags = damageFlags | ATTACK_FLAG.SHRAPNEL;

    for(let i = 0; i < targets.length; i++) {
        const target = targets[i];
        const damage = this.getAttackDamage(gameContext, target, flags);

        resolver.addAttack(target, damage);
    }
}

BattalionEntity.prototype.mResolveStreamblastAttack = function(gameContext, target, resolver) {
    const direction = this.getDirectionTo(target);
    const targets = getLineEntities(gameContext, direction, this.tileX, this.tileY, this.config.streamRange);

    for(let i = 0; i < targets.length; i++) {
        const target = targets[i];
        const damage = this.getAttackDamage(gameContext, target, ATTACK_FLAG.LINE);

        resolver.addAttack(target, damage);
    }

    this.mResolveAttackTraits(resolver);
}

BattalionEntity.prototype.mResolveDispersionAttack = function(gameContext, target, resolver) {
    const { tileX, tileY } = target;
    const range = this.hasTrait(TypeRegistry.TRAIT_TYPE.JUDGEMENT) ? TRAIT_CONFIG.JUDGEMENT_RANGE : TRAIT_CONFIG.DISPERSION_RANGE;
    const targets = getAreaEntities(gameContext, tileX, tileY, range);

    for(let i = 0; i < targets.length; i++) {
        const target = targets[i];
        const targetID = target.getID();

        //Exclude self from AOE attack.
        if(targetID !== this.id) {
            const damage = this.getAttackDamage(gameContext, target, ATTACK_FLAG.AREA);

            resolver.addAttack(target, damage);
        }
    }

    this.mResolveAttackTraits(resolver);
}

BattalionEntity.prototype.mResolveCounterAttack = function(gameContext, target, resolver) {
    const damage = this.getAttackDamage(gameContext, target, ATTACK_FLAG.COUNTER);

    resolver.addAttack(target, damage);

    if(this.hasTrait(TypeRegistry.TRAIT_TYPE.SHRAPNEL)) {
        this.mResolveShrapnel(gameContext, target, ATTACK_FLAG.COUNTER, resolver);
    }

    this.mResolveAttackTraits(resolver);
}

BattalionEntity.prototype.mResolveRegularAttack = function(gameContext, target, resolver) {
    const damage = this.getAttackDamage(gameContext, target, ATTACK_FLAG.NONE);

    resolver.addAttack(target, damage);

    if(this.hasTrait(TypeRegistry.TRAIT_TYPE.SHRAPNEL)) {
        this.mResolveShrapnel(gameContext, target, ATTACK_FLAG.NONE, resolver);
    }

    this.mResolveAttackTraits(resolver);
}

BattalionEntity.prototype.mResolveHeal = function(gameContext, target, resolver) {
    const amplifier = this.getHealAmplifier(gameContext);
    const heal = this.damage * amplifier;

    resolver.addHeal(target, heal);
}