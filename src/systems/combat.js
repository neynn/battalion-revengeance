import { EntityManager } from "../../engine/entity/entityManager.js";
import { BattalionEntity } from "../entity/battalionEntity.js";
import { Mine } from "../entity/mine.js";
import { ATTACK_FLAG, ATTACK_TYPE, ENTITY_CATEGORY, MOVEMENT_TYPE, RANGE_TYPE, TRAIT_CONFIG, TRAIT_TYPE, WEAPON_TYPE } from "../enums.js";
import { DIRECTION_DELTA_X, DIRECTION_DELTA_Y } from "./direction.js";

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
}

export const InteractionResolver = function() {
    this.resolutions = new Map();
    this.totalDamage = 0;
    this.totalHeal = 0;
    this.resourceDamage = 0;
}

InteractionResolver.prototype.getDamageFromDelta = function(delta) {
    if(delta >= 0) {
        return 0;
    }

    return -delta;
}

InteractionResolver.prototype.getDelta = function(entityID) {
    const delta = this.resolutions.get(entityID);

    if(delta === undefined) {
        return 0;
    }

    return delta;
}

InteractionResolver.prototype.addSelfDestruct = function(entity) {
    const entityID = entity.getID();

    //TODO(neyn): SELF_DESTRUCT is a rule override.
    //This should later be expanded upon!
    this.resolutions.set(entityID, -entity.health);
}

InteractionResolver.prototype.addSelfDamage = function(entity, damage) {
    //Self damage does not count towards total damage!
    const entityID = entity.getID();
    const delta = entity.getAttackDelta(damage, this.getDelta(entityID));

    this.add(entityID, delta);
}

InteractionResolver.prototype.addHeal = function(entity, heal) {
    const entityID = entity.getID();
    const delta = entity.getHealDelta(heal, this.getDelta(entityID));

    this.totalHeal += delta;
    this.add(entityID, delta);
}

InteractionResolver.prototype.addAttack = function(entity, damage) {
    const entityID = entity.getID();
    const delta = entity.getAttackDelta(damage, this.getDelta(entityID));
    const damageDealt = this.getDamageFromDelta(delta);
    const resourceDamage = entity.getDamageAsResources(damageDealt);

    this.totalDamage += damageDealt;
    this.resourceDamage += resourceDamage;
    this.add(entityID, delta);
}

InteractionResolver.prototype.add = function(entityID, delta) {
    if(this.resolutions.has(entityID)) {
        const total = this.resolutions.get(entityID);

        this.resolutions.set(entityID, total + delta);
    } else {
        this.resolutions.set(entityID, delta);
    }
}

InteractionResolver.prototype.createResolutions = function(gameContext) {
    const { world } = gameContext;
    const { entityManager } = world;
    const resolutions = [];

    for(const [entityID, delta] of this.resolutions) {
        const entity = entityManager.getEntity(entityID);
        const health = entity.getHealthFromDelta(delta);
        let finalHealth = health;

        //Clamp health to uint.
        if(finalHealth < 0) {
            finalHealth = 0;
        }

        resolutions.push(ResolutionSystem.fillEntityResolution(entityID, delta, health));
    }

    return resolutions;
}

/**
 * 
 * @param {BattalionEntity} attacker 
 * @param {InteractionResolver} resolver 
 */
const mResolveAttackTraits = function(attacker, resolver) {
    if(attacker.hasTrait(TRAIT_TYPE.OVERHEAT)) {
        const overheatDamage = attacker.getOverheatDamage();

        resolver.addSelfDamage(attacker, overheatDamage);
    }

    if(attacker.hasTrait(TRAIT_TYPE.ABSORBER)) {
        const { totalDamage } = resolver;
        const absorberHeal = attacker.getAbsorberHeal(totalDamage);

        resolver.addHeal(attacker, absorberHeal);
    }

    if(attacker.hasTrait(TRAIT_TYPE.SELF_DESTRUCT)) {
        resolver.addSelfDestruct(attacker);
    }
}

/**
 * 
 * @param {*} gameContext 
 * @param {BattalionEntity} attacker 
 * @param {BattalionEntity} target 
 * @param {number} damageFlags 
 * @param {InteractionResolver} resolver 
 */
const mResolveShrapnel = function(gameContext, attacker, target, damageFlags, resolver) {
    const { world } = gameContext;
    const { tileX, tileY } = target;
    const direction = attacker.getDirectionTo(target);
    const deltaX = DIRECTION_DELTA_X[direction];
    const deltaY = DIRECTION_DELTA_Y[direction];
    const targets = world.getEntitiesInLine(tileX, tileY, deltaX, deltaY, TRAIT_CONFIG.SHRAPNEL_RANGE);
    const flags = damageFlags | ATTACK_FLAG.SHRAPNEL;

    for(const target of targets) {
        if(target.isHurtByShrapnel()) {
            const damage = attacker.getAttackDamage(gameContext, target, flags);

            resolver.addAttack(target, damage);
        }
    }
}

/**
 * 
 * @param {*} gameContext 
 * @param {BattalionEntity} attacker 
 * @param {BattalionEntity} target 
 * @param {InteractionResolver} resolver 
 */
const mResolveRegularAttack = function(gameContext, attacker, target, resolver) {
    const damage = attacker.getAttackDamage(gameContext, target, ATTACK_FLAG.NONE);

    resolver.addAttack(target, damage);

    if(attacker.hasTrait(TRAIT_TYPE.SHRAPNEL)) {
        mResolveShrapnel(gameContext, attacker, target, ATTACK_FLAG.NONE, resolver);
    }

    mResolveAttackTraits(attacker, resolver);
}

/**
 * 
 * @param {*} gameContext 
 * @param {BattalionEntity} attacker 
 * @param {BattalionEntity} target 
 * @param {InteractionResolver} resolver 
 */
const mResolveCounterAttack = function(gameContext, attacker, target, resolver) {
    const damage = attacker.getAttackDamage(gameContext, target, ATTACK_FLAG.COUNTER);

    resolver.addAttack(target, damage);

    //TODO(neyn): Shrapnel did NOT work when countering in the original game.
    if(attacker.hasTrait(TRAIT_TYPE.SHRAPNEL)) {
        mResolveShrapnel(gameContext, attacker, target, ATTACK_FLAG.COUNTER, resolver);
    }

    mResolveAttackTraits(attacker, resolver);
}

/**
 * 
 * @param {*} gameContext 
 * @param {BattalionEntity} attacker 
 * @param {BattalionEntity} target 
 * @param {InteractionResolver} resolver 
 */
const mResolveDispersionAttack = function(gameContext, attacker, target, resolver) {
    const { world } = gameContext;
    const { tileX, tileY } = target;
    const range = attacker.hasTrait(TRAIT_TYPE.JUDGEMENT) ? TRAIT_CONFIG.JUDGEMENT_RANGE : TRAIT_CONFIG.DISPERSION_RANGE;
    const targets = world.getEntitiesInRange(tileX, tileY, range, range);

    for(const target of targets) {
        if(target.isHurtByDispersion()) {
            const damage = attacker.getAttackDamage(gameContext, target, ATTACK_FLAG.AREA);

            if(target.id === attacker.id) {
                resolver.addSelfDamage(target, damage);
            } else {
                resolver.addAttack(target, damage);
            }
        }
    }

    mResolveAttackTraits(attacker, resolver);
}

/**
 * 
 * @param {*} gameContext 
 * @param {BattalionEntity} attacker 
 * @param {BattalionEntity} target 
 * @param {InteractionResolver} resolver 
 */
const mResolveStreamblastAttack = function(gameContext, attacker, target, resolver) {
    const { world } = gameContext;
    const direction = attacker.getDirectionTo(target);
    const deltaX = DIRECTION_DELTA_X[direction];
    const deltaY = DIRECTION_DELTA_Y[direction];
    const targets = world.getEntitiesInLine(attacker.tileX, attacker.tileY, deltaX, deltaY, attacker.config.streamRange);

    for(const target of targets) {
        if(target.isHurtByStreamblast()) {
            const damage = attacker.getAttackDamage(gameContext, target, ATTACK_FLAG.STREAMBLAST);

            resolver.addAttack(target, damage);
        }
    }

    mResolveAttackTraits(attacker, resolver);
}

/**
 * 
 * @param {*} gameContext 
 * @param {BattalionEntity} healer 
 * @param {BattalionEntity} target 
 * @param {InteractionResolver} resolver 
 */
const mResolveHeal = function(gameContext, healer, target, resolver) {
    const amplifier = healer.getHealAmplifier(gameContext);
    const heal = Math.floor(healer.damage * amplifier);

    resolver.addHeal(target, heal);
}

/**
 * 
 * @param {BattalionEntity} attacker 
 * @param {BattalionEntity} target 
 * @returns {boolean}
 */
const isCounterValid = function(attacker, target) {
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
    if(attacker.lastAttacker !== targetID) {
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
}

export const CombatSystem = {
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

        if(healer.damage <= 0) {
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
        
        if(attacker.damage <= 0) {
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

        const traitID = mine.getNullifierTrait();

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
     * @param {BattalionEntity} entity 
     * @param {BattalionEntity} target 
     * @param {InteractionResolver} resolver 
     */
    resolveFirstAttack: function(gameContext, entity, target, resolver) {
        if(CombatSystem.isAttackValid(gameContext, entity, target) && CombatSystem.isAttackPositionValid(gameContext, entity, target)) {
            switch(entity.getAttackType()) {
                case ATTACK_TYPE.REGULAR: {
                    mResolveRegularAttack(gameContext, entity, target, resolver);
                    break;
                }
                case ATTACK_TYPE.DISPERSION: {
                    mResolveDispersionAttack(gameContext, entity, target, resolver);
                    break;
                }
                case ATTACK_TYPE.STREAMBLAST: {
                    mResolveStreamblastAttack(gameContext, entity, target, resolver);
                    break;
                }
                default: {
                    console.error("Unsupported attack type!");
                    break;
                }
            }
        }
    },
    /**
     * 
     * @param {*} gameContext 
     * @param {BattalionEntity} entity 
     * @param {BattalionEntity} target 
     * @param {InteractionResolver} resolver 
     */
    resolveCounterAttack: function(gameContext, entity, target, resolver) {
        if(isCounterValid(entity, target) && CombatSystem.isAttackValid(gameContext, entity, target) && CombatSystem.isAttackPositionValid(gameContext, entity, target)) {
            mResolveCounterAttack(gameContext, entity, target, resolver);
        }
    },
    /**
     * 
     * @param {*} gameContext 
     * @param {BattalionEntity} entity 
     * @param {BattalionEntity} target 
     * @param {InteractionResolver} resolver 
     */
    resolveHeal: function(gameContext, entity, target, resolver) {
        if(CombatSystem.isHealValid(gameContext, entity, target) && CombatSystem.isHealPositionValid(gameContext, entity, target)) {
            mResolveHeal(gameContext, entity, target, resolver);
        }
    }
};