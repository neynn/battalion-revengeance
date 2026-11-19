import { Entity } from "../../engine/entity/entity.js";
import { EntityManager } from "../../engine/entity/entityManager.js";
import { WorldMap } from "../../engine/map/worldMap.js";
import { isRectangleRectangleIntersect } from "../../engine/math/math.js";
import { DIRECTION_DELTA_X, DIRECTION_DELTA_Y, getDirectionByDelta, isDirectionValid } from "../systems/direction.js";
import { TRAIT_CONFIG, ATTACK_TYPE, DIRECTION, PATH_FLAG, MORALE_TYPE, WEAPON_TYPE, MOVEMENT_TYPE, TRAIT_TYPE, ENTITY_CATEGORY, JAMMER_FLAG, ENTITY_TYPE, TILE_TYPE, SHOP_TYPE } from "../enums.js";
import { TeamManager } from "../team/teamManager.js";
import { createEntitySnapshot } from "../snapshot/entitySnapshot.js";
import { ScenarioModel } from "../scenario/scenarioModel.js";
import { ShopType } from "../type/parsed/shopType.js";
import { TerrainType } from "../type/parsed/terrainType.js";
import { StealthSystem } from "../systems/stealth.js";
import { EntityType } from "../type/parsed/entityType.js";
import { UNIT_MAX_ACTIONS_PER_TURN, UNIT_MAX_MOVES_PER_TURN, UNIT_MAX_MORALE_DELTA, UNIT_MIN_MORALE_DELTA, JAMMER_TILES_WITH_NEIGHBORS } from "../constants.js";
import { TextRegistry } from "../registry/textRegistry.js";

/**
 * 
 * @param {number} id 
 * @param {EntityType} config 
 */
export const BattalionEntity = function(id, config) {
    Entity.call(this, id);

    this.tileX = -1;
    this.tileY = -1;
    this.tileZ = -1;
    
    this.customID = ScenarioModel.INVALID_CUSTOM_ID;
    this.customName = TextRegistry.INVALID_ID;
    this.customDesc = TextRegistry.INVALID_ID;

    this.config = config;
    this.health = 1;
    this.maxHealth = 1;
    this.moraleType = MORALE_TYPE.NORMAL;
    this.moraleDelta = 0;
    this.direction = DIRECTION.EAST;
    this.state = BattalionEntity.STATE.IDLE;
    this.teamID = TeamManager.INVALID_ID;
    this.transportID = ENTITY_TYPE._INVALID;
    this.turns = 0;
    this.cash = 0;
    this.opacity = 1;
    this.shop = SHOP_TYPE.NONE;
    
    this.doneMoves = 0;
    this.doneActions = 0;
    this.allowedMoves = UNIT_MAX_MOVES_PER_TURN;
    this.allowedActions = UNIT_MAX_ACTIONS_PER_TURN;
    this.bonusMoves = 0;
    this.bonusActions = 0;

    //Not persistent state.
    this.lastAttacker = EntityManager.INVALID_ID;
}

BattalionEntity.RENDER_FLAG = {
    NONE: 0,
    CLOAKED: 1 << 0,
    PROTECTED: 1 << 1,
    ACTING: 1 << 2,
    ACTED: 1 << 3,
    SHADED: 1 << 4,
    MARKABLE: 1 << 5
};

BattalionEntity.FLAG = {
    NONE: 0,
    IS_CLOAKED: 1 << 0,
    IS_SUBMERGED: 1 << 1,
    IS_PROTECTED: 1 << 2,
    IS_TURN: 1 << 3,
    BEWEGUNGSKRIEG_TRIGGERED: 1 << 4,
    ELUSIVE_TRIGGERED: 1 << 5,
    IS_DISABLED: 1 << 6,
    IS_REPAIRING: 1 << 7
};

BattalionEntity.STATE = {
    IDLE: 0,
    MOVE: 1,
    FIRE: 2,
    _COUNT: 3
};

BattalionEntity.prototype = Object.create(Entity.prototype);
BattalionEntity.prototype.constructor = BattalionEntity;

BattalionEntity.prototype.save = function() {
    const snapshot = createEntitySnapshot();

    snapshot.shop = this.shop;
    snapshot.doneMoves = this.doneMoves;
    snapshot.doneActions = this.doneActions;
    snapshot.allowedMoves = this.allowedMoves;
    snapshot.allowedActions = this.allowedActions;
    snapshot.bonusMoves = this.bonusMoves;
    snapshot.bonusActions = this.bonusActions;
    snapshot.type = this.config.id;
    snapshot.flags = this.flags;
    snapshot.health = this.health;
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
    this.shop = data.shop;
    this.doneMoves = data.doneMoves;
    this.doneActions = data.doneActions;
    this.allowedMoves = data.allowedMoves;
    this.allowedActions = data.allowedActions;
    this.bonusMoves = data.bonusMoves;
    this.bonusActions = data.bonusActions;
    this.flags = data.flags;
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
    this.syncRenderFlags();
}

/**
 * 
 * @param {*} gameContext 
 * @param {EntityType} config 
 */
BattalionEntity.prototype.loadConfig = function(gameContext, config) {
    const { health } = config;

    this.config = config;
    this.health = health;
    this.maxHealth = health;
    this.setHealth(this.health);
}

BattalionEntity.prototype.getDamage = function(gameContext) {
    //TODO(neyn): Return correct value based on mode.

    return this.config.damage;
}

BattalionEntity.prototype.isDisabled = function() {
    return this.hasFlag(BattalionEntity.FLAG.IS_DISABLED);
}

BattalionEntity.prototype.disable = function() {
    this.setFlag(BattalionEntity.FLAG.IS_DISABLED);
}

BattalionEntity.prototype.saveTransport = function() {
    this.transportID = this.config.id;
}

BattalionEntity.prototype.clearTransport = function() {
    this.transportID = ENTITY_TYPE._INVALID;
}

BattalionEntity.prototype.isTransporting = function() {
    return this.transportID !== ENTITY_TYPE._INVALID;
}

BattalionEntity.prototype.hasTransport = function(transportID) {
    return this.config.hasTransport(transportID);
}

BattalionEntity.prototype.setState = function(stateID) {
    this.state = stateID;
    this.syncRenderFlags();
}

BattalionEntity.prototype.belongsTo = function(teamID) {
    return this.teamID !== TeamManager.INVALID_ID && this.teamID === teamID;
}

BattalionEntity.prototype.getVitality = function() {
    return this.health / this.maxHealth;
}

BattalionEntity.prototype.getVitalityCapped = function() {
    const vitality = this.getVitality();

    if(vitality > 1) {
        return 1;
    }

    return vitality;
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

BattalionEntity.prototype.isEntityInRange = function(gameContext, entity) {
    const distance = this.getDistanceToEntity(entity);

    if(distance < this.config.minRange) {
        return false;
    }

    return distance <= this.getMaxRange(gameContext);
}

BattalionEntity.prototype.isAtFullHealth = function() {
    return this.health >= this.maxHealth;
}

BattalionEntity.prototype.getAttackDelta = function(damage = 0, accumulatedDelta = 0) {
    const realDamage = Math.floor(damage);

    if(realDamage <= 0) {
        return 0;
    }

    const effectiveHealth = this.health + accumulatedDelta;
    const health = effectiveHealth - realDamage;

    if(health <= 0) {
        if(effectiveHealth > TRAIT_CONFIG.HEROIC_THRESHOLD && this.hasTrait(TRAIT_TYPE.HEROIC)) {
            return TRAIT_CONFIG.HEROIC_THRESHOLD - effectiveHealth;
        }

        return -effectiveHealth;
    }

    return -realDamage;
}

BattalionEntity.prototype.getHealDelta = function(heal = 0, accumulatedDelta = 0) {
    const effectiveHealth = this.health + accumulatedDelta;
    let delta = Math.floor(heal);

    //Units that have more than 100% health should not receive the heal.
    //Negative healing is not allowed!
    if(delta <= 0 || effectiveHealth >= this.maxHealth) {
        return 0;
    }

    const missingHealth = this.maxHealth - effectiveHealth;

    if(delta > missingHealth) {
        delta = missingHealth;
    }

    return delta;
}

BattalionEntity.prototype.getRepairHealPercentage = function() {
    let healPercentage = (this.maxHealth - this.health) / this.maxHealth;

    //Healing is capped to a max of 25%
    if(healPercentage > 0.25) {
        healPercentage = 0.25;
    } else if(healPercentage < 0) {
        healPercentage = 0;
    }
    
    return healPercentage;
}

BattalionEntity.prototype.getStartOfTurnDelta = function(gameContext) {
    //Skips the first turn to prohibit unfair state.
    if(this.turns <= 0) {
        return 0;
    }

    const damage = this.getTerrainDamage(gameContext);
    let delta = -Math.floor(damage);
    let bonusHealth = 0;

    if(this.hasTrait(TRAIT_TYPE.REPAIR)) {
        bonusHealth += TRAIT_CONFIG.REPAIR_VALUE;
    }

    if(this.hasFlag(BattalionEntity.FLAG.IS_REPAIRING)) {
        bonusHealth += Math.floor(this.maxHealth * this.getRepairHealPercentage());
    }

    //Heal if below maxHealth but cap the healing to maxHealth.
    if(bonusHealth > 0 && this.health < this.maxHealth) {
        const missingHealth = this.maxHealth - this.health;

        if(bonusHealth > missingHealth) {
            delta += missingHealth;
        } else {
            delta += bonusHealth;
        }
    }

    const nextHealth = this.health + delta;

    //Ensures that health never drops below 0.
    if(nextHealth < 0) {
        delta = -this.health;
    }

    return delta;
}

BattalionEntity.prototype.getHealthFromDelta = function(delta = 0) {
    return this.health + delta;
}

BattalionEntity.prototype.getDamageAsResources = function(lostHP) {
    if(lostHP < 0) {
        return 0;
    }

    const costFactor = this.maxHealth * this.config.cost;

    if(costFactor <= 0) {
        return 0;
    }

    return Math.floor(lostHP / costFactor);
}

BattalionEntity.prototype.setHealth = function(health) {
    if(health < 0) {
        this.health = 0;
    } else {
        this.health = Math.floor(health);
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

BattalionEntity.prototype.getTileXByDirection = function(direction) {
    return this.tileX + DIRECTION_DELTA_X[direction];
}

BattalionEntity.prototype.getTileYByDirection = function(direction) {
    return this.tileY + DIRECTION_DELTA_Y[direction];
}

BattalionEntity.prototype.setDirection = function(direction) {
    if(this.direction === direction || !isDirectionValid(direction)) {
        return false;
    }

    this.direction = direction;

    return true;
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

BattalionEntity.prototype.getMorale = function() {
    let morale = this.moraleType + this.moraleDelta;

    if(morale < MORALE_TYPE.LOWEST)  {
        morale = MORALE_TYPE.LOWEST;
    } else if(morale > MORALE_TYPE.HIGHEST) {
        morale = MORALE_TYPE.HIGHEST;
    }

    return morale;
}

BattalionEntity.prototype.reduceMorale = function() {
    this.moraleDelta--;

    if(this.moraleDelta < UNIT_MIN_MORALE_DELTA) {
        this.moraleDelta = UNIT_MIN_MORALE_DELTA;
    }
}

BattalionEntity.prototype.increaseMorale = function() {
    this.moraleDelta++;

    if(this.moraleDelta > UNIT_MAX_MORALE_DELTA) {
        this.moraleDelta = UNIT_MAX_MORALE_DELTA;
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
    if(this.hasTrait(TRAIT_TYPE.COMMANDO)) {
        return 0;
    }

    const { world, typeRegistry } = gameContext;
    const worldMap = world.getWorldMap();

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

BattalionEntity.prototype.isMoveTargetValid = function(gameContext, targetX, targetY) {
    const { world } = gameContext;
    const tileEntity = world.getEntityAt(targetX, targetY);

    if(tileEntity && tileEntity.isVisibleTo(gameContext, this.teamID)) {
        return false;
    }

    return true;
}

BattalionEntity.prototype.updateRangeGuard = function(gameContext) {
    this.flags &= ~BattalionEntity.FLAG.IS_PROTECTED;

    //Air units are never protected by tiles/canyons!
    if(this.config.category === ENTITY_CATEGORY.AIR) {
        return;
    }

    const { world, typeRegistry } = gameContext;
    const worldMap = world.getWorldMap();

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
                    return;
                }
            }
        }
    }
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

BattalionEntity.prototype.canCloakAtSelf = function(gameContext) {
    return StealthSystem.canEntityCloakAt(gameContext, this, this.tileX, this.tileY);
}

BattalionEntity.prototype.isDiscoveredByJammer = function(gameContext) {
    return StealthSystem.isEntityDiscoveredByJammerAt(gameContext, this, this.tileX, this.tileY);
}

BattalionEntity.prototype.hasWeapon = function() {
    return this.config.weaponType !== WEAPON_TYPE.NONE;
}

BattalionEntity.prototype.isMoveable = function() {
    return this.config.movementRange !== 0 && this.config.movementType !== MOVEMENT_TYPE.STATIONARY;
}

BattalionEntity.prototype.getMaxMoves = function() {
    return this.allowedMoves + this.bonusMoves;
}

BattalionEntity.prototype.getMaxActions = function() {
    return this.allowedActions + this.bonusActions;
}

BattalionEntity.prototype.isAllowedToMove = function() {
    return this.doneMoves < this.getMaxMoves();
}

BattalionEntity.prototype.isAllowedToAct = function() {
    return this.doneActions < this.getMaxActions();
}

BattalionEntity.prototype.isAllowedToActAndMove = function() {
    return this.isAllowedToMove() && this.isAllowedToAct();
}

BattalionEntity.prototype.hasMoved = function() {
    return this.doneMoves > 0;
}

BattalionEntity.prototype.hasActed = function() {
    return this.doneActions > 0;
}

BattalionEntity.prototype.onTurnStart = function() {
    this.setFlag(BattalionEntity.FLAG.IS_TURN);
    this.clearFlag(BattalionEntity.FLAG.BEWEGUNGSKRIEG_TRIGGERED | BattalionEntity.FLAG.ELUSIVE_TRIGGERED | BattalionEntity.FLAG.IS_REPAIRING);
    this.clearLastAttacker();
    this.doneMoves = 0;
    this.doneActions = 0;
    this.allowedMoves = UNIT_MAX_MOVES_PER_TURN;
    this.allowedActions = UNIT_MAX_ACTIONS_PER_TURN;
    this.bonusMoves = 0;
    this.bonusActions = 0;
    this.syncRenderFlags();
} 

BattalionEntity.prototype.onTurnEnd = function() {
    this.clearFlag(BattalionEntity.FLAG.IS_TURN);
    this.clearLastAttacker();
    this.doneMoves = UNIT_MAX_MOVES_PER_TURN;
    this.doneActions = UNIT_MAX_ACTIONS_PER_TURN;
    this.allowedMoves = UNIT_MAX_MOVES_PER_TURN;
    this.allowedActions = UNIT_MAX_ACTIONS_PER_TURN;
    this.bonusMoves = 0;
    this.bonusActions = 0;
    this.turns++;
    this.syncRenderFlags();
}

BattalionEntity.prototype.triggerScavenge = function() {
    this.bonusMoves++;
    this.bonusActions++;
    this.syncRenderFlags();
}

BattalionEntity.prototype.triggerBewegungskrieg = function() {
    if(!this.hasFlag(BattalionEntity.FLAG.BEWEGUNGSKRIEG_TRIGGERED)) {
        this.bonusMoves++;
        this.bonusActions++;
        this.setFlag(BattalionEntity.FLAG.BEWEGUNGSKRIEG_TRIGGERED);
        this.syncRenderFlags();
    }
}

BattalionEntity.prototype.triggerElusive = function() {
    if(!this.hasFlag(BattalionEntity.FLAG.ELUSIVE_TRIGGERED)) {
        this.bonusMoves++;
        this.setFlag(BattalionEntity.FLAG.ELUSIVE_TRIGGERED);
        this.syncRenderFlags();
    }
}

BattalionEntity.prototype.consumeMove = function() {
    //Moves only consume a point and do not care about acting.
    this.doneMoves++;
    this.syncRenderFlags();
}

BattalionEntity.prototype.consumeAct = function() {
    const maxActions = this.getMaxActions();

    this.doneActions++;

    //When an entity has consumes all its action points, then it will also consume all its move points.
    if(this.doneActions >= maxActions) {
        this.doneActions = maxActions;
        this.doneMoves = this.getMaxMoves();
    }

    this.syncRenderFlags();
}

BattalionEntity.prototype.consumeAll = function() {
    this.doneActions = this.getMaxActions();
    this.doneMoves = this.getMaxMoves();
    this.syncRenderFlags();
}

BattalionEntity.prototype.isSelectable = function() {
    return !this.isDead() && this.isAllowedToActAndMove() && !this.hasTrait(TRAIT_TYPE.NOT_SELECTABLE);
}

BattalionEntity.prototype.getMaxRange = function(gameContext) {
    const { world, typeRegistry } = gameContext;
    const worldMap = world.getWorldMap();

    const startX = this.tileX;
    const startY = this.tileY;
    const endX = startX + this.config.dimX;
    const endY = startY + this.config.dimY;

    let range = this.config.maxRange;
    let maxBoost = 0;

    //Find the max range boost from all tiles the entity is standing on.
    for(let i = startY; i < endY; i++) {
        for(let j = startX; j < endX; j++) {
            const { terrain } = worldMap.getTileType(gameContext, j, i);

            for(const terrainID of terrain) {
                const { rangeModifier } = typeRegistry.getTerrainType(terrainID);

                if(rangeModifier > maxBoost) {
                    maxBoost = rangeModifier;
                }
            }
        }
    }

    range += maxBoost;

    if(range < this.config.minRange) {
        range = this.config.minRange;
    }
    
    return range;
}

BattalionEntity.prototype.getDistanceMoved = function(deltaTime) {
    return this.config.movementSpeed * deltaTime;
}

BattalionEntity.prototype.isJammer = function() {
    return this.config.jammerRange > 0 && this.config.getJammerFlags() !== JAMMER_FLAG.NONE;
}

BattalionEntity.prototype.setUncloaked = function() {
    this.clearFlag(BattalionEntity.FLAG.IS_CLOAKED);

    if(this.hasTrait(TRAIT_TYPE.SUBMERGED)) {
        this.clearFlag(BattalionEntity.FLAG.IS_SUBMERGED);
    }

    this.clearRFlag(BattalionEntity.RENDER_FLAG.CLOAKED);
}

BattalionEntity.prototype.setCloaked = function() {
    this.setFlag(BattalionEntity.FLAG.IS_CLOAKED);

    if(this.hasTrait(TRAIT_TYPE.SUBMERGED)) {
        this.setFlag(BattalionEntity.FLAG.IS_SUBMERGED);
    }

    this.setRFlag(BattalionEntity.RENDER_FLAG.CLOAKED);
}

BattalionEntity.prototype.isLastAttackedBy = function(entityID) {
    return this.lastAttacker !== EntityManager.INVALID_ID && this.lastAttacker === entityID;
}

BattalionEntity.prototype.clearLastAttacker = function() {
    this.lastAttacker = EntityManager.INVALID_ID;
}

BattalionEntity.prototype.setLastAttacker = function(entityID) {
    if(entityID !== this.id) {
        this.lastAttacker = entityID;
    }
}

BattalionEntity.prototype.getOverheatDamage = function() {
    return Math.floor(this.maxHealth * TRAIT_CONFIG.OVERHEAT_DAMAGE);
}

BattalionEntity.prototype.getAbsorberHeal = function(damage) {
    return Math.floor(damage * TRAIT_CONFIG.ABSORBER_RATE);
}

BattalionEntity.prototype.isHurtByShrapnel = function() {
    //Shrapnel does not hurt air and submerged units.
    return this.config.category !== ENTITY_CATEGORY.AIR && !this.hasFlag(BattalionEntity.FLAG.IS_SUBMERGED);
}

BattalionEntity.prototype.isHurtByStreamblast = function() {
    //Streamblast does not hurt air and submerged units.
    return this.config.category !== ENTITY_CATEGORY.AIR && !this.hasFlag(BattalionEntity.FLAG.IS_SUBMERGED);
}

BattalionEntity.prototype.isHurtByDispersion = function() {
    //Dispersion does not hurt air units, but unlike SHRAPNEL and STREAMBLAST hurts IS_SUBMERGED units.
    return this.config.category !== ENTITY_CATEGORY.AIR;
}

BattalionEntity.prototype.placeOnMap = function(gameContext) {
    const { world } = gameContext;
    const worldMap = world.getWorldMap();

    if(!worldMap) {
        return;
    }

    const { dimX, dimY, jammerRange } = this.config;
    const jammerFlags = this.config.getJammerFlags();

    worldMap.addEntity(this.tileX, this.tileY, dimX, dimY, this.index);

    if(jammerFlags !== JAMMER_FLAG.NONE) {
        const tileDeltas = JAMMER_TILES_WITH_NEIGHBORS[jammerRange];

        for(let i = 0; i < tileDeltas.length; i += 3) {
            const tileX = this.tileX + tileDeltas[i];
            const tileY = this.tileY + tileDeltas[i + 1];

            worldMap.addJammer(tileX, tileY, this.id, this.teamID, jammerFlags);
        }
    }

    this.updateRangeGuard(gameContext);
    this.syncRenderFlags();
}

BattalionEntity.prototype.removeFromMap = function(gameContext) {
    const { world } = gameContext;
    const worldMap = world.getWorldMap();

    if(!worldMap) {
        return;
    }

    const { dimX, dimY, jammerRange } = this.config;
    const jammerFlags = this.config.getJammerFlags();

    worldMap.removeEntity(this.tileX, this.tileY, dimX, dimY, this.index);

    if(jammerFlags !== JAMMER_FLAG.NONE) {
        const tileDeltas = JAMMER_TILES_WITH_NEIGHBORS[jammerRange];

        for(let i = 0; i < tileDeltas.length; i += 3) {
            const tileX = this.tileX + tileDeltas[i];
            const tileY = this.tileY + tileDeltas[i + 1];

            worldMap.removeJammer(tileX, tileY, this.id, this.teamID, jammerFlags);
        }
    }
}

BattalionEntity.prototype.setPurchased = function() {
    //Set this.turns to 0, because it is the entities first turn.
    //It will be set to 1 when onTurnEnd is called from the EndTurnAction!
    this.onTurnEnd();
    this.flags |= BattalionEntity.FLAG.IS_TURN;
    this.turns = 0;
    this.syncRenderFlags();
}

BattalionEntity.prototype.reduceCash = function(cash) {
    this.cash -= cash;
}

//TODO(neyn): Most of this must be calculated in MinePlaceAction!
BattalionEntity.prototype.canPlaceMine = function(gameContext) {
    const { world, typeRegistry } = gameContext;

    //Only engineers are able to place mines.
    if(!this.hasTrait(TRAIT_TYPE.ENGINEER)) {
        return false;
    }

    //TODO: Cost needs inflation adjustment
    const { mine } = typeRegistry.getShopType(this.shop);
    const { cost, category } = typeRegistry.getMineType(mine);

    if(this.cash < cost) {
        return false;
    }

    //Tiles should only be placeable on the units feet.
    //_INVALID mines will never be placeable.
    const worldMap = world.getWorldMap();
    const isPlaceable = worldMap.isMinePlaceable(gameContext, this.tileX, this.tileY, category);

    return isPlaceable;
}

BattalionEntity.prototype.getDescription = function(gameContext) {
    const { textRegistry } = gameContext;
    
    if(this.customDesc !== TextRegistry.INVALID_ID) {
        return textRegistry.getScenarioTranslation(this.customDesc);
    }

    return textRegistry.getSystemTranslation(this.config.desc);
}

BattalionEntity.prototype.getName = function(gameContext) {
    const { textRegistry } = gameContext;
    
    if(this.customName !== TextRegistry.INVALID_ID) {
        return textRegistry.getScenarioTranslation(this.customName);
    }

    return textRegistry.getSystemTranslation(this.config.name);
}

BattalionEntity.prototype.setOpacity = function(opacity) {
    this.opacity = opacity;
}

BattalionEntity.prototype.syncRenderFlags = function() {
    this.renderFlags = BattalionEntity.RENDER_FLAG.NONE;

    if(this.flags & BattalionEntity.FLAG.IS_CLOAKED) {
        this.renderFlags |= BattalionEntity.RENDER_FLAG.CLOAKED;
    }

    if(this.flags & BattalionEntity.FLAG.IS_PROTECTED) {
        this.renderFlags |= BattalionEntity.RENDER_FLAG.PROTECTED;
    }

    if(!this.isAllowedToAct() || !this.isAllowedToMove()) {
        this.renderFlags |= BattalionEntity.RENDER_FLAG.ACTED;

        if(this.flags & BattalionEntity.FLAG.IS_TURN) {
            if(this.state === BattalionEntity.STATE.IDLE) {
                this.renderFlags |= BattalionEntity.RENDER_FLAG.SHADED;
            }
        }
    }

    if(this.state === BattalionEntity.STATE.IDLE) {
        if(!this.hasTrait(TRAIT_TYPE.NOT_SELECTABLE)) {
            this.renderFlags |= BattalionEntity.RENDER_FLAG.MARKABLE;
        }
    } else {
        this.renderFlags |= BattalionEntity.RENDER_FLAG.ACTING;
    }
}