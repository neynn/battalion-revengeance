import { Entity } from "../../engine/entity/entity.js";
import { LanguageHandler } from "../../engine/language/languageHandler.js";
import { isRectangleRectangleIntersect } from "../../engine/math/math.js";
import { FloodFill } from "../../engine/pathfinders/floodFill.js";
import { TypeRegistry } from "../type/typeRegistry.js";
import { EntityFlagMap } from "./flagMap.js";

export const BattalionEntity = function(id, sprite) {
    Entity.call(this, id, "");

    this.health = 1;
    this.maxHealth = 1;
    this.damage = 0;
    this.range = 0;
    this.moraleAmplifier = 1;
    this.moraleType = TypeRegistry.MORALE_TYPE.NONE;
    this.weaponType = TypeRegistry.WEAPON_TYPE.NONE;
    this.armorType = TypeRegistry.ARMOR_TYPE.NONE;
    this.movementSpeed = 56;
    this.movementRange = 1;
    this.movementType = TypeRegistry.MOVEMENT_TYPE.STATIONARY;
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
    this.traits = [];
}

BattalionEntity.MAX_MOVE_COST = 99;

BattalionEntity.DIRECTION_TYPE = {
    NORTH: "NORTH",
    EAST: "EAST",
    SOUTH: "SOUTH",
    WEST: "WEST"
};

BattalionEntity.DIRECTION = {
    NORTH: 1 << 0,
    EAST: 1 << 1,
    SOUTH: 1 << 2,
    WEST: 1 << 3
};

BattalionEntity.STATE = {
    IDLE: 0,
    MOVE: 1,
    FIRE: 2
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
};

BattalionEntity.prototype = Object.create(Entity.prototype);
BattalionEntity.prototype.constructor = BattalionEntity;

BattalionEntity.prototype.loadConfig = function(config) {
    const { health, movementRange, movementType, damage, weaponType, armorType } = config;

    this.config = config;
    this.health = health ?? 1;
    this.maxHealth = health ?? 1;
    this.damage = damage ?? 0;
    this.weaponType = TypeRegistry.WEAPON_TYPE[weaponType] ? weaponType : TypeRegistry.WEAPON_TYPE.NONE;
    this.armorType = TypeRegistry.ARMOR_TYPE[armorType] ? armorType : TypeRegistry.ARMOR_TYPE.NONE;
    this.movementType = TypeRegistry.MOVEMENT_TYPE[movementType] ? movementType : TypeRegistry.MOVEMENT_TYPE.STATIONARY;
    this.movementRange = movementRange ?? 1;
}

BattalionEntity.prototype.setCustomText = function(name, desc) {
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

    const sharedTag = this.config.desc;

    if(sharedTag) {
        return language.get(sharedTag);
    }

    return language.get("MISSING_ENTITY_DESC");
}

BattalionEntity.prototype.getDisplayName = function(gameContext) {
    const { language } = gameContext;
    
    if(this.customName) {
        return language.get(this.customName, LanguageHandler.TAG_TYPE.MAP);
    }

    const sharedTag = this.config.name;

    if(sharedTag) {
        return language.get(sharedTag);
    }

    return language.get("MISSING_ENTITY_NAME");
}

BattalionEntity.prototype.setCustomID = function(id) {
    this.customID = id;
}

BattalionEntity.prototype.removeTraits = function() {
    this.traits.length = 0;
}

BattalionEntity.prototype.hasTrait = function(traitID) {
    for(let i = 0; i < this.traits.length; i++) {
        if(this.traits[i] === traitID) {
            return true;
        }
    }

    return false;
}

BattalionEntity.prototype.removeTrait = function(traitID) {
    for(let i = 0; i < this.traits.length; i++) {
        if(this.traits[i] === traitID) {
            this.traits[i] = this.traits[this.traits.length - 1];
            this.traits.pop();
            break;
        }
    }
}

BattalionEntity.prototype.loadTraits = function() {
    const traits = this.config.traits;

    if(traits) {
        for(let i = 0; i < traits.length; i++) {
            const traitID = TypeRegistry.TRAIT_TYPE[traits[i]];

            if(traitID !== undefined) {
                this.traits.push(traitID);
            }
        }
    }
}

BattalionEntity.prototype.destroy = function() {
    this.isMarkedForDestroy = true;
    this.sprite.destroy();
}

BattalionEntity.prototype.setTile = function(tileX, tileY) {
    this.tileX = tileX;
    this.tileY = tileY;
}

BattalionEntity.prototype.setPosition = function(positionVector) {
    const { x, y } = positionVector;

    this.sprite.setPosition(x, y);
}

BattalionEntity.prototype.setDirectionByName = function(name) {
    const direction = BattalionEntity.DIRECTION[name];

    if(direction !== undefined) {
        this.direction = direction;
    }
}

BattalionEntity.prototype.setDirection = function(direction) {
    if(Object.values(BattalionEntity.DIRECTION).includes(direction)) {
        this.direction = direction;
    }
}

BattalionEntity.prototype.setState = function(state) {
    if(Object.values(BattalionEntity.STATE).includes(state)) {
        this.state = state;
    }
}

BattalionEntity.prototype.getSpriteTypeID = function() {
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

BattalionEntity.prototype.getSpriteID = function() {
    const spriteTypeID = this.getSpriteTypeID();
    const spriteID = this.config.sprites[spriteTypeID];

    if(spriteID === undefined) {
        return null;
    }

    return spriteID;
}

BattalionEntity.prototype.updateSchema = function(gameContext, schemaID, schema) {
    this.sprite.updateSchema(gameContext, schemaID, schema);
}

BattalionEntity.prototype.updateSprite = function(gameContext) {
    const spriteID = this.getSpriteID();

    if(spriteID) {
        this.sprite.updateType(gameContext, spriteID);
    }
}

BattalionEntity.prototype.setTeam = function(teamID) {
    this.teamID = teamID;
}

BattalionEntity.prototype.onTurnStart = function(gameContext) {
    console.log("My turn started", this);
} 

BattalionEntity.prototype.onTurnEnd = function(gameContext) {
    console.log("My turn ended", this);
}

BattalionEntity.prototype.occupiesTile = function(tileX, tileY) {
    return isRectangleRectangleIntersect(tileX, tileY, 1, 1, this.tileX, this.tileY, this.config.dimX ?? 1, this.config.dimY ?? 1);
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

BattalionEntity.prototype.isSelectable = function() {
    return !this.isMarkedForDestroy && !this.isDead();
}

BattalionEntity.prototype.isDead = function() {
    return this.health <= 0;
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

BattalionEntity.prototype.mGetNodeMap = function(gameContext, nodeMap) {
    const { world, typeRegistry } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    nodeMap.clear();

    if(this.isDead()) {
        return;
    }

    const flagMap = new EntityFlagMap(this.tileX, this.tileY, this.movementRange);
    const startID = worldMap.getIndex(this.tileX, this.tileY);
    const startNode = createNode(startID, this.tileX, this.tileY, 0, null, null, 0);
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

            if(neighborID !== -1) {
                let tileType = typeCache.get(neighborID);

                if(!tileType) {
                    tileType = worldMap.getTileTypeObject(gameContext, neighborX, neighborY);
                    typeCache.set(neighborID, tileType);
                }
                
                const { terrain, passability } = tileType;
                let nextCost = passability[this.movementType] ?? BattalionEntity.MAX_MOVE_COST;

                if(nextCost !== BattalionEntity.MAX_MOVE_COST) {
                    const flags = flagMap.getFlag(neighborX, neighborY);
                    //TODO: Implement entity blocking/flying over. Z-Levels?

                    for(let i = 0; i < terrain.length; i++) {
                        const terrainType = typeRegistry.getType(terrain[i], TypeRegistry.CATEGORY.TERRAIN);
                        const { movement } = terrainType;
                        const terrainModifier = movement[this.movementType] ?? 0;

                        nextCost += terrainModifier;
                    }
                }

                if(nextCost < 1) {
                    nextCost = 1;
                }

                const neighborCost = cost + nextCost;

                if(neighborCost <= this.movementRange) {
                    const bestCost = visitedCost.get(neighborID);

                    if(bestCost === undefined || neighborCost < bestCost) {
                        const childNode = createNode(neighborID, neighborX, neighborY, neighborCost, type, id, 0);

                        queue.push(childNode);
                        visitedCost.set(neighborID, neighborCost);
                        nodeMap.set(neighborID, childNode);
                    }
                } else if(!nodeMap.has(neighborID)) {
                    //This is unreachable.
                    const childNode = createNode(neighborID, neighborX, neighborY, neighborCost, type, id, -1);

                    nodeMap.set(neighborID, childNode);
                }
            }
        }
    }

    console.log(typeCache)
}

BattalionEntity.prototype.getPath = function(gameContext, nodes, targetX, targetY) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const path = [];

    if(!worldMap) {
        return path;
    }

    const index = worldMap.getIndex(targetX, targetY);
    const targetNode = nodes.get(index);

    if(!targetNode || targetNode.flags === -1) {
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

        path.push({
            "deltaX": deltaX,
            "deltaY": deltaY,
            "tileX": lastX,
            "tileY": lastY
        });

        i++;
        lastX = x;
        lastY = y;
        currentNode = nodes.get(parent);
    }

    return path.reverse();
}

BattalionEntity.prototype.getDamageTo = function(gameContext, target) {
    const { typeRegistry } = gameContext;
    const weaponType = typeRegistry.getType(this.weaponType, TypeRegistry.CATEGORY.WEAPON);

    let damage = this.damage;

    damage *= weaponType.armor[target.armorType] ?? 1;
    damage *= this.moraleAmplifier;

    for(let i = 0; i < this.traits.length; i++) {
        const traitType = typeRegistry.getType(this.traits[i], TypeRegistry.CATEGORY.TRAIT);
        const { moveDamage, armorDamage } = traitType;
        const moveAmplifier = moveDamage[target.movementType] ?? 1;
        const armorAmpligier = armorDamage[target.armorType] ?? 1;

        damage *= moveAmplifier;
        damage *= armorAmpligier;
    }

    //TODO: Special logic like "Absorber", "Suicide", "SupplyDistribution".

    return damage;
}