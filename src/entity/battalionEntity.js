import { Entity } from "../../engine/entity/entity.js";
import { LanguageHandler } from "../../engine/language/languageHandler.js";
import { isRectangleRectangleIntersect } from "../../engine/math/math.js";
import { FloodFill } from "../../engine/pathfinders/floodFill.js";
import { AttackAction } from "../action/types/attack.js";
import { TypeRegistry } from "../type/typeRegistry.js";
import { EntityType } from "./entityType.js";

const DAMAGE_AMPLIFIER = {
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
    this.isCloaked = false;
    this.movesLeft = 0;
    this.transportID = null;
}

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
    RECRUIT: "recruit"
};

BattalionEntity.DEFAULT_SPRITES = {
    [BattalionEntity.SPRITE_TYPE.ATTACK]: "small_attack",
    [BattalionEntity.SPRITE_TYPE.DEATH]: "explosion"
};

BattalionEntity.DEFAULT_SOUNDS = {
    [BattalionEntity.SOUND_TYPE.CLOAK]: "cloak",
    [BattalionEntity.SOUND_TYPE.DEATH]: "explosion",
    [BattalionEntity.SOUND_TYPE.RECRUIT]: null //TODO: Implement
};

BattalionEntity.TRANSPORT_TYPE = {
    BARGE: 0,
    PELICAN: 1,
    STORK: 2
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
    const delta = this.health - damage;

    if(delta < 0) {
        return 0;
    }

    return delta;
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

BattalionEntity.prototype.hasMoveLeft = function() {
    return this.movesLeft > 0;
}

BattalionEntity.prototype.reduceMove = function(delta = 1) {
    this.movesLeft -= delta;

    if(this.movesLeft <= 0) {
        this.sprite.pause();
    }

    return this.movesLeft;
}

BattalionEntity.prototype.refreshMoves = function(moves) {
    this.movesLeft = moves;

    if(this.movesLeft > 0) {
        this.sprite.resume();
    }
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
    this.isCloaked = true;
    this.playSound(gameContext, BattalionEntity.SOUND_TYPE.CLOAK);
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

BattalionEntity.prototype.playCounter = function(gameContext) {
    this.state = BattalionEntity.STATE.FIRE;
    this.playSound(gameContext, BattalionEntity.SOUND_TYPE.FIRE);
    this.updateSprite(gameContext);
    this.sprite.lockEnd();
}

BattalionEntity.prototype.updateDirectionByDelta = function(deltaX, deltaY) {
    if(deltaY < 0) return this.setDirection(BattalionEntity.DIRECTION.NORTH);
    if(deltaY > 0) return this.setDirection(BattalionEntity.DIRECTION.SOUTH);
    if(deltaX < 0) return this.setDirection(BattalionEntity.DIRECTION.WEST);
    if(deltaX > 0) return this.setDirection(BattalionEntity.DIRECTION.EAST);
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
    let sprite = this.config.sprites.death;

    if(!sprite) {
        sprite = BattalionEntity.DEFAULT_SPRITES[BattalionEntity.SPRITE_TYPE.DEATH];
    }

    return sprite;
}

BattalionEntity.prototype.getAttackSprite = function() {
    let sprite = this.config.sprites.attack;

    if(!sprite) {
        sprite = BattalionEntity.DEFAULT_SPRITES[BattalionEntity.SPRITE_TYPE.ATTACK];
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

BattalionEntity.prototype.onTurnStart = function(gameContext) {
    this.refreshMoves(100);
    //this.sprite.thaw();

    console.log("My turn started", this);
} 

BattalionEntity.prototype.onTurnEnd = function(gameContext) {
    this.movesLeft = 0;
    //this.sprite.freeze();

    console.log("My turn ended", this);
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
    return this.health <= 0 && !this.isMarkedForDestroy;
}

BattalionEntity.prototype.mGetNodeMap = function(gameContext, nodeMap) {
    if(this.isDead() || !this.canMove()) {
        return;
    }

    const { world, typeRegistry, teamManager } = gameContext;
    const { mapManager, entityManager } = world;
    const worldMap = mapManager.getActiveMap();

    //const flagMap = new EntityFlagMap(this.tileX, this.tileY, this.movementRange);
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
                let nextCost = cost;
                let tileType = typeCache.get(neighborID);

                if(!tileType) {
                    tileType = worldMap.getTileTypeObject(gameContext, neighborX, neighborY);
                    typeCache.set(neighborID, tileType);
                }
                
                const { terrain, passability } = tileType;

                nextCost += passability[this.config.movementType] ?? BattalionEntity.MAX_MOVE_COST;

                if(nextCost < BattalionEntity.MAX_MOVE_COST) {
                    for(let i = 0; i < terrain.length; i++) {
                        const { moveCost } = typeRegistry.getType(terrain[i], TypeRegistry.CATEGORY.TERRAIN);
                        const terrainModifier = moveCost[this.config.movementType] ?? 0;

                        nextCost += terrainModifier;
                    }

                    {
                        const entityID = worldMap.getTopEntity(neighborX, neighborY);
                        const entity = entityManager.getEntity(entityID);
                        
                        if(entity)   {
                            const { teamID } = entity;
                            const isAlly = teamManager.isAlly(this.teamID, teamID);

                            //TODO: Bypassing, team checks.
                            if(!isAlly) {
                                nextCost += BattalionEntity.MAX_MOVE_COST;
                            }
                        }
                    }
                }

                if(nextCost < 1) {
                    nextCost = 1;
                }

                if(nextCost <= this.movementRange) {
                    const bestCost = visitedCost.get(neighborID);

                    if(bestCost === undefined || nextCost < bestCost) {
                        const childNode = createNode(neighborID, neighborX, neighborY, nextCost, type, id, 0);

                        queue.push(childNode);
                        visitedCost.set(neighborID, nextCost);
                        nodeMap.set(neighborID, childNode);
                    }
                } else if(!nodeMap.has(neighborID)) {
                    //This is unreachable.
                    const childNode = createNode(neighborID, neighborX, neighborY, nextCost, type, id, -1);

                    nodeMap.set(neighborID, childNode);
                }
            }
        }
    }
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

    //TODO: Logic for hovering ON an enemy entity -> if attackRange = 1, then find any neighboring tile.
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

    return path;
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
        const type = typeRegistry.getType(typeID, TypeRegistry.CATEGORY.TERRAIN);

        if(type) {
            types.push(type);
        }
    }

    return types;
}

BattalionEntity.prototype.getDamageAmplifier = function(gameContext, target, attackType) {
    const { world, typeRegistry } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    let damageAmplifier = 1;

    if(!this.hasTrait(TypeRegistry.TRAIT_TYPE.INDOMITABLE)) {
        const healthFactor = this.health / this.maxHealth;

        if(healthFactor > 1) {
            damageAmplifier *= 1;
        } else {
            damageAmplifier *= healthFactor;
        }
    }

    const weaponType = typeRegistry.getType(this.config.weaponType, TypeRegistry.CATEGORY.WEAPON);

    //Armor and Morale factor.
    damageAmplifier *= weaponType.armorResistance[target.armorType] ?? 1;
    damageAmplifier *= this.moraleAmplifier;

    const climateType = worldMap.getClimateTypeObject(gameContext, this.tileX, this.tileY);
    const { logisticFactor } = climateType;
    
    //Logistic factor.
    damageAmplifier *= logisticFactor;

    for(let i = 0; i < this.config.traits.length; i++) {
        const { moveDamage, armorDamage } = typeRegistry.getType(this.config.traits[i], TypeRegistry.CATEGORY.TRAIT);
        const moveAmplifier = moveDamage[target.movementType] ?? 1;
        const armorAmplifier = armorDamage[target.armorType] ?? 1;

        //Trait movement + armor factor.
        damageAmplifier *= moveAmplifier;
        damageAmplifier *= armorAmplifier;
    }

    const { terrain } = worldMap.getTileTypeObject(gameContext, target.tileX, target.tileY);

    for(let i = 0; i < terrain.length; i++) {
        const { moveProtection } = typeRegistry.getType(terrain[i], TypeRegistry.CATEGORY.TERRAIN);
        const protectionAmplifier = moveProtection[target.movementType] ?? 1;

        //Terrain protection factor.
        damageAmplifier *= protectionAmplifier;
    }

    //Commando trait (terrain based).
    //Steer (don't really like this one).

    switch(attackType) {
        case AttackAction.ATTACK_TYPE.INITIATE: {
            //Schwerpunkt factor.
            if(this.hasTrait(TypeRegistry.TRAIT_TYPE.SCHWERPUNKT) && target.movementType === TypeRegistry.MOVEMENT_TYPE.FOOT) {
                damageAmplifier *= DAMAGE_AMPLIFIER.SCHWERPUNKT;
            }

            //Stealth factor.
            if(this.isCloaked) {
                damageAmplifier *= DAMAGE_AMPLIFIER.STEALTH;
            }

            break;
        }
        case AttackAction.ATTACK_TYPE.COUNTER: {
            break;
        }
        default:  {
            console.warn("Unsupported attack type!", attackType);
            break;
        }
    }

    return damageAmplifier;
}

BattalionEntity.prototype.getDamage = function(gameContext, target, attackType) {
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
        target.movementType === TypeRegistry.MOVEMENT_TYPE.FLIGHT &&
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

    //TODO: Special logic like "Absorber", "Suicide", "SupplyDistribution".

    return damage;
}

BattalionEntity.prototype.lookAt = function(entity) {
    const deltaX = entity.tileX - this.tileX;
    const deltaY = entity.tileY - this.tileY;
    const distanceX = Math.abs(deltaX);
    const distanceY = Math.abs(deltaY);

    if(distanceX > distanceY) {
        this.updateDirectionByDelta(deltaX, 0);
    } else { 
        this.updateDirectionByDelta(0, deltaY);
    }
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

BattalionEntity.prototype.isHidden = function() {
    return this.isCloaked;
}

BattalionEntity.prototype.cloakInstant = function() {
    if(!this.isCloaked) {
        this.sprite.setOpacity(0);
        this.isCloaked = true;
    }
}

BattalionEntity.prototype.uncloakInstant = function() {
    if(this.isCloaked) {
        this.sprite.setOpacity(1);
        this.isCloaked = false;
    }
}

BattalionEntity.prototype.setOpacity = function(opacity) {
    this.sprite.setOpacity(opacity);
}

BattalionEntity.prototype.canCloak = function() {
    return !this.isCloaked && this.hasTrait(TypeRegistry.TRAIT_TYPE.STEALTH);
}

BattalionEntity.prototype.canAttack = function() {
    return this.damage !== 0 && this.config.weaponType !== TypeRegistry.WEAPON_TYPE.NONE;
}

BattalionEntity.prototype.canMove = function() {
    return this.movementRange !== 0 && this.config.movementType !== TypeRegistry.MOVEMENT_TYPE.STATIONARY;
}   

BattalionEntity.prototype.getMaxRange = function(gameContext) {
    const terrainTypes = this.getTerrainTypes(gameContext);
    let range = this.config.maxRange;

    for(let i = 0; i < terrainTypes.length; i++) {
        range += terrainTypes[i].rangeBoost ?? 0;
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

BattalionEntity.prototype.onArrive = function(gameContext) {
    const terrainTypes = this.getTerrainTypes(gameContext);
    //TODO: After a move ended, this checks the tile for any properties like damage_on_land
    //TODO: Also add an attack after move. Move can carry an attack target, which gets put as "next", if not uncloaked by a stealth unit.
}

BattalionEntity.prototype.isRanged = function() {
    return this.config.maxRange !== 1 && this.config.weaponType !== TypeRegistry.WEAPON_TYPE.NONE;
} 