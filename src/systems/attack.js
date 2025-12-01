import { ATTACK_TYPE } from "../enums.js";

export const resolveCounterAttack = function(gameContext, entity, target, resolver) {
    if(entity.isAllowedToCounter(target) && entity.canAttackTarget(gameContext, target)) {
        entity.mResolveCounterAttack(gameContext, target, resolver);
    }
}

export const resolveInitiateAttack = function(gameContext, entity, target, resolver) {
    switch(entity.getAttackType()) {
        case ATTACK_TYPE.REGULAR: {
            if(entity.canAttackTarget(gameContext, target)) {
                entity.mResolveRegularAttack(gameContext, target, resolver);
            }

            break;
        }
        case ATTACK_TYPE.DISPERSION: {
            if(entity.canAttackTarget(gameContext, target)) {
                entity.mResolveDispersionAttack(gameContext, target, resolver);
            }

            break;
        }
        case ATTACK_TYPE.STREAMBLAST: {
            if(entity.canAttackTarget(gameContext, target)) {
                entity.mResolveStreamblastAttack(gameContext, target, resolver);
            }

            break;
        }
        case ATTACK_TYPE.SUPPLY: {
            if(entity.canHealTarget(gameContext, target)) {
                entity.mResolveHeal(gameContext, target, resolver);
            }

            break;
        }
        default: {
            console.error("Unsupported attack type!");
            break;
        }
    }
}