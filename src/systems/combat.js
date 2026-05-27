import { InteractionResolver } from "../action/interactionResolver.js";
import { BattalionEntity } from "../entity/battalionEntity.js";
import { Mine } from "../entity/mine.js";
import { ATTACK_FLAG, TRAIT_CONFIG, TRAIT_TYPE } from "../enums.js";
import { DIRECTION_DELTA_X, DIRECTION_DELTA_Y } from "./direction.js";

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

export const CombatSystem = {
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
     * @param {BattalionEntity} attacker 
     * @param {BattalionEntity} target 
     * @param {InteractionResolver} resolver 
     */
    mResolveRegularAttack: function(gameContext, attacker, target, resolver) {
        const damage = attacker.getAttackDamage(gameContext, target, ATTACK_FLAG.NONE);

        resolver.addAttack(target, damage);

        if(attacker.hasTrait(TRAIT_TYPE.SHRAPNEL)) {
            mResolveShrapnel(gameContext, attacker, target, ATTACK_FLAG.NONE, resolver);
        }

        mResolveAttackTraits(attacker, resolver);
    },
    /**
     * 
     * @param {*} gameContext 
     * @param {BattalionEntity} attacker 
     * @param {BattalionEntity} target 
     * @param {InteractionResolver} resolver 
     */
    mResolveCounterAttack: function(gameContext, attacker, target, resolver) {
        const damage = attacker.getAttackDamage(gameContext, target, ATTACK_FLAG.COUNTER);

        resolver.addAttack(target, damage);

        //TODO(neyn): Shrapnel did NOT work when countering in the original game.
        if(attacker.hasTrait(TRAIT_TYPE.SHRAPNEL)) {
            mResolveShrapnel(gameContext, attacker, target, ATTACK_FLAG.COUNTER, resolver);
        }

        mResolveAttackTraits(attacker, resolver);
    },
    /**
     * 
     * @param {*} gameContext 
     * @param {BattalionEntity} attacker 
     * @param {BattalionEntity} target 
     * @param {InteractionResolver} resolver 
     */
    mResolveDispersionAttack: function(gameContext, attacker, target, resolver) {
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
    },
    /**
     * 
     * @param {*} gameContext 
     * @param {BattalionEntity} attacker 
     * @param {BattalionEntity} target 
     * @param {InteractionResolver} resolver 
     */
    mResolveStreamblastAttack: function(gameContext, attacker, target, resolver) {
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
    },
    /**
     * 
     * @param {*} gameContext 
     * @param {BattalionEntity} healer 
     * @param {BattalionEntity} target 
     * @param {InteractionResolver} resolver 
     */
    mResolveHeal: function(gameContext, healer, target, resolver) {
        const amplifier = healer.getHealAmplifier(gameContext);
        const heal = Math.floor(healer.damage * amplifier);

        resolver.addHeal(target, heal);
    }
};