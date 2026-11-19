import { EntityManager } from "../../engine/entity/entityManager.js";
import { BattalionEntity } from "../entity/battalionEntity.js";
import { Mine } from "../entity/mine.js";
import { ATTACK_TYPE, ENTITY_CATEGORY, MOVEMENT_TYPE, RANGE_TYPE, TRAIT_CONFIG, TRAIT_TYPE, WEAPON_TYPE } from "../enums.js";
import { DIRECTION_DELTA_X, DIRECTION_DELTA_Y } from "./direction.js";

const COMBAT_FLAG = {
    NONE: 0,
    COUNTER: 1 << 0,
    SHRAPNEL: 1 << 1,
    AREA: 1 << 2,
    STREAMBLAST: 1 << 3
};

/**
 * 
 * @param {*} gameContext 
 * @param {BattalionEntity} attacker 
 * @returns 
 */
const getLogisticFactor = function(gameContext, attacker) {
    const { world } = gameContext;
    const worldMap = world.getWorldMap();

    const startX = attacker.tileX;
    const startY = attacker.tileY;
    const endX = startX + attacker.config.dimX;
    const endY = startY + attacker.config.dimY;

    let totalLogisticFactor = 0;
    let count = 0;

    for(let i = startY; i < endY; i++) {
        for(let j = startX; j < endX; j++) {
            const { logisticFactor } = worldMap.getClimateType(gameContext, j, i);

            totalLogisticFactor += logisticFactor;
            count++;
        }
    }

    //Takes the average of all logistic factors.
    if(count !== 0) {
        totalLogisticFactor /= count;
    } else {
        totalLogisticFactor = 1;
    }

    //COMMANDO reduces the total impact negative logistic factors have.
    //A factor of 0.2 would reduce damage by 80%, but COMMANDO halves that damage reduction to 40% (0.6).
    if(totalLogisticFactor < 1 && attacker.hasTrait(TRAIT_TYPE.COMMANDO)) {
        totalLogisticFactor = 1 - (1 - totalLogisticFactor) * TRAIT_CONFIG.COMMANDO_LOGISTIC_REDUCTION;
    }

    return totalLogisticFactor;
}

/**
 * 
 * @param {BattalionEntity} entity 
 * @returns {number}
 */
const getHealthFactor = function(entity) {
    let healthFactor = 1;

    if(!entity.hasTrait(TRAIT_TYPE.INDOMITABLE)) {
        healthFactor = entity.getVitalityCapped();
    }

    return healthFactor;
}

/**
 * 
 * @param {*} gameContext 
 * @param {BattalionEntity} attacker 
 * @param {number} targetArmor 
 * @returns {number}
 */
const getWeaponFactor = function(gameContext, attacker, targetArmor) {
    const { typeRegistry } = gameContext;
    const weaponType = typeRegistry.getWeaponType(attacker.config.weaponType);
    let damageMultiplier = weaponType.getDamageMultiplier(targetArmor);

    //Ignore only damage reduction with ARMOR_PIERCE, keep the damage increase.
    if(damageMultiplier < 1 && attacker.hasTrait(TRAIT_TYPE.ARMOR_PIERCE)) {
        damageMultiplier = 1;
    }

    return damageMultiplier;
}

/**
 * 
 * @param {*} gameContext 
 * @param {BattalionEntity} target 
 * @returns 
 */
const getTerrainFactor = function(gameContext, target) {
    const { world, typeRegistry } = gameContext;
    const worldMap = world.getWorldMap();

    const startX = target.tileX;
    const startY = target.tileY;
    const endX = startX + target.config.dimX;
    const endY = startY + target.config.dimY;
    const targetMove = target.config.movementType;

    let terrainFactor = 1;

    //TODO: Large units may get absurd protection.
    for(let i = startY; i < endY; i++) {
        for(let j = startX; j < endX; j++) {
            const { terrain } = worldMap.getTileType(gameContext, j, i);

            for(const terrainID of terrain) {
                const terrainType = typeRegistry.getTerrainType(terrainID);
                const protectionFactor = terrainType.getProtection(targetMove);

                //Immeditately return 0 if a terrain fully protects.
                //This means all damage gets set to 0.
                if(protectionFactor >= 1) {
                    return 0;
                }

                terrainFactor *= (1 - protectionFactor);
            }
        }
    }

    return terrainFactor;
}

/**
 * 
 * @param {*} gameContext 
 * @param {BattalionEntity} entity 
 * @returns {number}
 */
const getMoraleFactor = function(gameContext, entity) {
    const { typeRegistry } = gameContext;
    const { damageModifier } = typeRegistry.getMoraleType(entity.getMorale());

    return damageModifier;
}

/**
 * 
 * @param {*} gameContext 
 * @param {BattalionEntity} attacker 
 * @param {BattalionEntity} target 
 * @param {number} flags 
 * @returns 
 */
const getAttackAmplifier = function(gameContext, attacker, target, flags) {
    const { typeRegistry } = gameContext;
    const targetArmor = target.config.armorType;
    const targetMove = target.config.movementType;

    let healthFactor = 1;
    let moraleFactor = 1;
    let weaponFactor = 1;
    let terrainFactor = 1;
    let logisticFactor = 1;
    let traitFactor = 1;
    let otherFactor = 1;
    let damageAmplifier = 1;

    healthFactor = getHealthFactor(attacker);
    moraleFactor = getMoraleFactor(gameContext, attacker);
    weaponFactor = getWeaponFactor(gameContext, attacker, targetArmor);
    terrainFactor = getTerrainFactor(gameContext, target);
    logisticFactor = getLogisticFactor(gameContext, attacker);

    //Attacker traits.
    for(const traitID of attacker.config.traits) {
        const traitType = typeRegistry.getTraitType(traitID);
        
        //Move and armor factor.
        traitFactor *= traitType.getMoveDamage(targetMove);
        traitFactor *= traitType.getArmorDamage(targetArmor);
    }

    //Bonus damage if target at full health.
    if(target.isAtFullHealth() && attacker.hasTrait(TRAIT_TYPE.BULLDOZE)) {
        otherFactor *= TRAIT_CONFIG.BULLDOZE_DAMAGE;
    }

    //Steer trait. Reduces damage received by STEER for each tile the target can travel further. Up to STEER_MAX_REDUCTION.
    if(attacker.config.category === ENTITY_CATEGORY.SEA && target.hasTrait(TRAIT_TYPE.STEER)) {
        const deltaRange = target.config.movementRange - attacker.config.movementRange;

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
    if(flags & COMBAT_FLAG.COUNTER) {
        if(attacker.hasTrait(TRAIT_TYPE.SLUGGER)) {
            healthFactor = 1;
        }
    } else {
        //Bonus damage if attacking at full health.
        if(healthFactor >= 1 && attacker.hasTrait(TRAIT_TYPE.ANNIHILATE)) {
            otherFactor *= TRAIT_CONFIG.ANNIHILATE_DAMAGE;
        }

        //Blitz factor.
        if(attacker.hasTrait(TRAIT_TYPE.BLITZ)) {
            otherFactor *= TRAIT_CONFIG.BLITZ_MULTIPLIER;
        }

        //Schwerpunkt factor.
        if(attacker.hasTrait(TRAIT_TYPE.SCHWERPUNKT) && targetMove === MOVEMENT_TYPE.FOOT) {
            otherFactor *= TRAIT_CONFIG.SCHWERPUNKT_MULTIPLIER;
        }

        //Stealth factor.
        if(attacker.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
            otherFactor *= TRAIT_CONFIG.STEALTH_MULTIPLIER;
        }

        const isExecutable = target.getVitality() < TRAIT_CONFIG.EXECUTIONER_THRESHOLD;

        if(isExecutable && attacker.hasTrait(TRAIT_TYPE.EXECUTIONER)) {
            otherFactor *= TRAIT_CONFIG.EXECUTIONER_DAMAGE;
        }
    }

    if(flags & COMBAT_FLAG.SHRAPNEL) {
        otherFactor *= TRAIT_CONFIG.SHRAPNEL_DAMAGE;
    }

    damageAmplifier *= healthFactor;
    damageAmplifier *= moraleFactor;
    damageAmplifier *= weaponFactor;
    damageAmplifier *= terrainFactor;
    damageAmplifier *= logisticFactor;
    damageAmplifier *= traitFactor;
    damageAmplifier *= otherFactor;

    return damageAmplifier;
}

/**
 * 
 * @param {*} gameContext 
 * @param {BattalionEntity} healer 
 * @returns 
 */
const getHealAmplifier = function(gameContext, healer) {
    let healAmplifier = 1;

    healAmplifier *= getHealthFactor(healer);
    healAmplifier *= getMoraleFactor(gameContext, healer);
    healAmplifier *= getLogisticFactor(gameContext, healer);

    return healAmplifier;
}

export const CombatSystem = {
    /**
     * 
     * @param {BattalionEntity} attacker 
     * @param {BattalionEntity} target 
     * @returns {boolean}
     */
    isCounterValid: function(attacker, target) {
        //Only regular attackers can counter.
        if(attacker.getAttackType() !== ATTACK_TYPE.REGULAR || target.getAttackType() !== ATTACK_TYPE.REGULAR) {
            return false;
        }

        //Certain entities can never counter.
        if(attacker.hasTrait(TRAIT_TYPE.BLIND_SPOT) || attacker.hasTrait(TRAIT_TYPE.SELF_DESTRUCT)) {
            return false;
        }

        const targetID = target.getID();

        //Target should be the previous attacker.
        if(!attacker.isLastAttackedBy(targetID)) {
            return false;
        }

        //STUN can never be countered.
        if(target.hasTrait(TRAIT_TYPE.STUN)) {
            return false;
        }

        //TANK_HUNTER disables TRACKED from countering.
        if(target.hasTrait(TRAIT_TYPE.TANK_HUNTER) && attacker.config.movementType === MOVEMENT_TYPE.TRACKED) {
            return false;
        }

        switch(target.config.rangeType) {
            case RANGE_TYPE.RANGE: {
                if(!attacker.hasTrait(TRAIT_TYPE.COUNTER_BATTERY)) {
                    return false;
                }

                break;
            }
            case RANGE_TYPE.HYBRID: {
                //Edge case: If two hybrids are next to each other, treat attacking as melee.
                if(!attacker.hasTrait(TRAIT_TYPE.COUNTER_BATTERY) && !attacker.isNextToEntity(target)) {
                    return false;
                }

                break;
            }
        }

        return true;
    },
    /**
     * 
     * @param {*} gameContext 
     * @param {BattalionEntity} healer 
     * @param {BattalionEntity} target 
     * @returns {boolean}
     */
    isHealValid: function(gameContext, healer, target) {
        if(healer.id === target.getID()) {
            return false;
        }

        if(healer.getDamage(gameContext) <= 0) {
            return false;
        }

        if(healer.isDead() || target.isDead()) {
            return false;
        }

        //Only suppliers can heal. 
        if(!healer.hasTrait(TRAIT_TYPE.SUPPLY_DISTRIBUTION)) {
            return false;
        }

        //Stationary entities cannot be healed.
        //TODO(neyn): Irreparable does this! Fix!
        if(target.config.movementType === MOVEMENT_TYPE.STATIONARY) {
            return false;
        }

        //Cannot heal enemies.
        if(!healer.isAllyWith(gameContext, target)) {
            return false;
        }

        return true;
    },
    /**
     * 
     * @param {*} gameContext 
     * @param {BattalionEntity} healer 
     * @param {BattalionEntity} target 
     * @returns {boolean}
     */
    isHealPositionValid: function(gameContext, healer, target) {
        if(!healer.isEntityInRange(gameContext, target)) {
            return false;
        }

        return true;
    },
    /**
     * 
     * @param {*} gameContext 
     * @param {BattalionEntity} attacker 
     * @param {BattalionEntity} target 
     * @returns {boolean}
     */
    isAttackValid: function(gameContext, attacker, target) {
        if(attacker.id === target.getID()) {
            return false;
        }
        
        if(attacker.getDamage(gameContext) <= 0) {
            return false;
        }
    
        if(attacker.config.weaponType === WEAPON_TYPE.NONE) {
            return false;
        }
    
        if(attacker.isDead() || target.isDead()) {
            return false;
        }
    
        //Stealth check. Cloaked units cannot be attacked.
        if(target.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
            return false;
        }
    
        //Allies cannot be attacked.
        if(attacker.isAllyWith(gameContext, target)) {
            return false;
        }
    
        if(target.config.category === ENTITY_CATEGORY.AIR) {
            //Air units can only be attacked with skysweeper.
            if(!attacker.hasTrait(TRAIT_TYPE.SKYSWEEPER)) {
                return false;
            }
        }
    
        //Seabound entities can only attack SEA units.
        if(target.config.category !== ENTITY_CATEGORY.SEA && attacker.hasTrait(TRAIT_TYPE.SEABOUND)) {
            return false;
        }
    
        //Special submarine case. Submarines can only be targeted by DEPTH_CHARGE.
        if(target.hasTrait(TRAIT_TYPE.SUBMERGED) && !attacker.hasTrait(TRAIT_TYPE.DEPTH_CHARGE)) {
            return false;
        }
    
        return true;
    },
    /**
     * 
     * @param {*} gameContext 
     * @param {BattalionEntity} attacker 
     * @param {BattalionEntity} target 
     * @returns {boolean}
     */
    isAttackPositionValid: function(gameContext, attacker, target) {
        if(!attacker.isEntityInRange(gameContext, target)) {
            return false;
        }

        //Special ranged interaction for RANGE & HYBRID.
        switch(attacker.config.rangeType) {
            case RANGE_TYPE.RANGE: {
                //Protected targets cannot be shot.
                if(target.hasFlag(BattalionEntity.FLAG.IS_PROTECTED)) {
                    return false;
                }

                break;
            }
            case RANGE_TYPE.HYBRID: {
                //Special case for entities with MIN_RANGE of 1 and MAX_RANGE of n.
                if(!attacker.isNextToEntity(target) && target.hasFlag(BattalionEntity.FLAG.IS_PROTECTED)) {
                    return false;
                }

                break;
            }
        }

        //Streamblast and clean shot entities can only attack in a direct lane.
        if(!attacker.isAxisMeeting(target)) {
            if(attacker.hasTrait(TRAIT_TYPE.STREAMBLAST) || attacker.hasTrait(TRAIT_TYPE.CLEAR_SHOT)) {
                return false;
            }
        }

        return true;
    },
    /**
     * 
     * @param {*} gameContext 
     * @param {BattalionEntity} entity 
     * @param {Mine} mine 
     * @returns 
     */
    isMineTriggered: function(gameContext, entity, mine) {
        const { teamManager } = gameContext;
        const damage = mine.getDamage(entity.config.movementType);

        //Only mines that deal damage blow up.
        if(damage <= 0) {
            return false;
        }

        const traitID = mine.config.nullifierTrait;

        //Some traits can dodge mines.
        //These are defined in mine.js
        if(entity.hasTrait(traitID)) {
            return false;
        }

        //Only enemy mines blow up.
        return !teamManager.isAlly(entity.teamID, mine.teamID);
    },
    /**
     * 
     * @param {*} gameContext 
     * @param {BattalionEntity} attacker 
     * @param {BattalionEntity} target 
     * @param {number} flags 
     * @returns 
     */
    getAttackDamage: function(gameContext, attacker, target, flags) {
        const damageAmplifier = getAttackAmplifier(gameContext, attacker, target, flags);
        let damage = attacker.getDamage(gameContext) * damageAmplifier;

        if(target.hasTrait(TRAIT_TYPE.CEMENTED_STEEL_ARMOR) && !attacker.hasTrait(TRAIT_TYPE.CAVITATION_EXPLOSION)) {
            damage -= TRAIT_CONFIG.CEMENTED_STEEL_ARMOR_REDUCTION;
        }

        if(damage < 0) {
            damage = 0;
        }

        //Unknown calculation.
        //Air units always take a max of 25 damage when the attacker does not have ANTI_AIR.
        if(
            damage > 25 &&
            target.config.category === ENTITY_CATEGORY.AIR &&
            !attacker.hasTrait(TRAIT_TYPE.ANTI_AIR)
        ) {
            damage = 25;
        }

        if(attacker.hasTrait(TRAIT_TYPE.JUDGEMENT)) {
            damage = TRAIT_CONFIG.JUDGEMENT_DAMAGE;
        }

        if(damage > 0 && damage < 1) {
            damage = 1;
        }

        return Math.floor(damage);
    }
};

export const ResolutionSystem = {
    createEntityResolution: function() {
        return {
            "entityID": EntityManager.INVALID_ID,
            "delta": 0,
            "health": 0
        }
    },
    fillEntityResolution: function(entityID, delta, health) {
        const resolution = ResolutionSystem.createEntityResolution();

        resolution.entityID = entityID;
        resolution.delta = delta;
        resolution.health = health;

        return resolution;
    },
    getDeadEntities: function(resolutions) {
        const deadEntities = [];

        for(const resolution of resolutions) {
            if(resolution.health === 0) {
                deadEntities.push(resolution.entityID);
            }
        }

        return deadEntities;
    }
};

export const CombatResolver = function() {
    this.resolutions = new Map();
    this.totalDamage = 0;
    this.totalHeal = 0;
    this.resourceDamage = 0;
}

CombatResolver.prototype.getDamageFromDelta = function(delta) {
    if(delta >= 0) {
        return 0;
    }

    return -delta;
}

CombatResolver.prototype.getDelta = function(entityID) {
    const delta = this.resolutions.get(entityID);

    if(delta === undefined) {
        return 0;
    }

    return delta;
}

CombatResolver.prototype.addSelfDestruct = function(entity) {
    const entityID = entity.getID();

    //TODO(neyn): SELF_DESTRUCT is a rule override.
    //This should later be expanded upon!
    this.resolutions.set(entityID, -entity.health);
}

CombatResolver.prototype.addSelfDamage = function(entity, damage) {
    //Self damage does not count towards total damage!
    const entityID = entity.getID();
    const delta = entity.getAttackDelta(damage, this.getDelta(entityID));

    this.add(entityID, delta);
}

CombatResolver.prototype.addHeal = function(entity, heal) {
    const entityID = entity.getID();
    const delta = entity.getHealDelta(heal, this.getDelta(entityID));

    this.totalHeal += delta;
    this.add(entityID, delta);
}

CombatResolver.prototype.addAttack = function(entity, damage) {
    const entityID = entity.getID();
    const delta = entity.getAttackDelta(damage, this.getDelta(entityID));
    const damageDealt = this.getDamageFromDelta(delta);
    const resourceDamage = entity.getDamageAsResources(damageDealt);

    this.totalDamage += damageDealt;
    this.resourceDamage += resourceDamage;
    this.add(entityID, delta);
}

CombatResolver.prototype.add = function(entityID, delta) {
    if(this.resolutions.has(entityID)) {
        const total = this.resolutions.get(entityID);

        this.resolutions.set(entityID, total + delta);
    } else {
        this.resolutions.set(entityID, delta);
    }
}

CombatResolver.prototype.createResolutions = function(gameContext) {
    const { world } = gameContext;
    const { entityManager } = world;
    const resolutions = [];

    for(const [entityID, delta] of this.resolutions) {
        const entity = entityManager.getEntity(entityID);
        let finalHealth = entity.getHealthFromDelta(delta);

        //Clamp health to uint.
        if(finalHealth < 0) {
            finalHealth = 0;
        }

        resolutions.push(ResolutionSystem.fillEntityResolution(entityID, delta, finalHealth));
    }

    return resolutions;
}

CombatResolver.prototype.resolveAttackTraits = function(attacker) {
    if(attacker.hasTrait(TRAIT_TYPE.OVERHEAT)) {
        const overheatDamage = attacker.getOverheatDamage();

        this.addSelfDamage(attacker, overheatDamage);
    }

    if(attacker.hasTrait(TRAIT_TYPE.ABSORBER)) {
        const absorberHeal = attacker.getAbsorberHeal(this.totalDamage);

        this.addHeal(attacker, absorberHeal);
    }

    if(attacker.hasTrait(TRAIT_TYPE.SELF_DESTRUCT)) {
        this.addSelfDestruct(attacker);
    }
}

CombatResolver.prototype.resolveRegularAttack = function(gameContext, attacker, target) {
    const damage = CombatSystem.getAttackDamage(gameContext, attacker, target, COMBAT_FLAG.NONE);

    this.addAttack(target, damage);

    if(attacker.hasTrait(TRAIT_TYPE.SHRAPNEL)) {
        this.resolveShrapnel(gameContext, attacker, target, COMBAT_FLAG.NONE);
    }

    this.resolveAttackTraits(attacker);
}

CombatResolver.prototype.resolveShrapnel = function(gameContext, attacker, target, damageFlags) {
    const { world } = gameContext;
    const { tileX, tileY } = target;
    const direction = attacker.getDirectionTo(target);
    const deltaX = DIRECTION_DELTA_X[direction];
    const deltaY = DIRECTION_DELTA_Y[direction];
    const targets = world.getEntitiesInLine(tileX, tileY, deltaX, deltaY, TRAIT_CONFIG.SHRAPNEL_RANGE);
    const flags = damageFlags | COMBAT_FLAG.SHRAPNEL;

    for(const target of targets) {
        if(target.isHurtByShrapnel()) {
            const damage = CombatSystem.getAttackDamage(gameContext, attacker, target, flags);

            this.addAttack(target, damage);
        }
    }
}

CombatResolver.prototype.resolveCounterAttack = function(gameContext, attacker, target) {
    const damage = CombatSystem.getAttackDamage(gameContext, attacker, target, COMBAT_FLAG.COUNTER);

    this.addAttack(target, damage);

    //TODO(neyn): Shrapnel did NOT work when countering in the original game.
    if(attacker.hasTrait(TRAIT_TYPE.SHRAPNEL)) {
        this.resolveShrapnel(gameContext, attacker, target, COMBAT_FLAG.COUNTER);
    }

    this.resolveAttackTraits(attacker);
}

CombatResolver.prototype.resolveDispersionAttack = function(gameContext, attacker, target) {
    const { world } = gameContext;
    const { tileX, tileY } = target;
    const range = attacker.hasTrait(TRAIT_TYPE.JUDGEMENT) ? TRAIT_CONFIG.JUDGEMENT_RANGE : TRAIT_CONFIG.DISPERSION_RANGE;
    const targets = world.getEntitiesInRange(tileX, tileY, range, range);

    for(const target of targets) {
        if(target.isHurtByDispersion()) {
            const damage = CombatSystem.getAttackDamage(gameContext, attacker, target, COMBAT_FLAG.AREA);

            if(target.id === attacker.id) {
                this.addSelfDamage(target, damage);
            } else {
                this.addAttack(target, damage);
            }
        }
    }

    this.resolveAttackTraits(attacker);
}

CombatResolver.prototype.resolveStreamblastAttack = function(gameContext, attacker, target) {
    const { world } = gameContext;
    const direction = attacker.getDirectionTo(target);
    const deltaX = DIRECTION_DELTA_X[direction];
    const deltaY = DIRECTION_DELTA_Y[direction];
    const targets = world.getEntitiesInLine(attacker.tileX, attacker.tileY, deltaX, deltaY, attacker.config.streamRange);

    for(const target of targets) {
        if(target.isHurtByStreamblast()) {
            const damage = CombatSystem.getAttackDamage(gameContext, attacker, target, COMBAT_FLAG.STREAMBLAST);

            this.addAttack(target, damage);
        }
    }

    this.resolveAttackTraits(attacker);
}

CombatResolver.prototype.doCounterAttack = function(gameContext, entity, target) {
    if(
        CombatSystem.isCounterValid(entity, target)
        && CombatSystem.isAttackValid(gameContext, entity, target)
        && CombatSystem.isAttackPositionValid(gameContext, entity, target)
    ) {
        this.resolveCounterAttack(gameContext, entity, target);
    }
}

CombatResolver.prototype.doFirstAttack = function(gameContext, entity, target) {
    if(
        CombatSystem.isAttackValid(gameContext, entity, target)
        && CombatSystem.isAttackPositionValid(gameContext, entity, target)
    ) {
        switch(entity.getAttackType()) {
            case ATTACK_TYPE.REGULAR: {
                this.resolveRegularAttack(gameContext, entity, target);
                break;
            }
            case ATTACK_TYPE.DISPERSION: {
                this.resolveDispersionAttack(gameContext, entity, target);
                break;
            }
            case ATTACK_TYPE.STREAMBLAST: {
                this.resolveStreamblastAttack(gameContext, entity, target);
                break;
            }
            default: {
                console.error("Unsupported attack type!");
                break;
            }
        }
    }
}

CombatResolver.prototype.doHeal = function(gameContext, entity, target) {
    if(
        CombatSystem.isHealValid(gameContext, entity, target)
        && CombatSystem.isHealPositionValid(gameContext, entity, target)
    ) {
        const amplifier = getHealAmplifier(gameContext, entity);
        const heal = Math.floor(entity.getDamage(gameContext) * amplifier);

        this.addHeal(target, heal);
    }
}