import { Action } from "../../../engine/action/action.js";
import { FlagHelper } from "../../../engine/flagHelper.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";
import { ATTACK_TYPE, COMMAND_TYPE } from "../../enums.js";
import { playAttackEffect } from "../../systems/animation.js";
import { TypeRegistry } from "../../type/typeRegistry.js";
import { ActionHelper, createAttackRequest } from "../actionHelper.js";
import { InteractionResolver } from "./interactionResolver.js";

const resolveCounterAttack = function(gameContext, entity, target, resolver) {
    if(entity.isAllowedToCounter(target) && entity.canAttackTarget(gameContext, target)) {
        entity.mResolveCounterAttack(gameContext, target, resolver);
    }
}

const resolveFirstAttack = function(gameContext, entity, target, resolver) {
    if(entity.canAttackTarget(gameContext, target)) {
        switch(entity.getAttackType()) {
            case ATTACK_TYPE.REGULAR: {
                entity.mResolveRegularAttack(gameContext, target, resolver);
                break;
            }
            case ATTACK_TYPE.DISPERSION: {
                entity.mResolveDispersionAttack(gameContext, target, resolver);
                break;
            }
            case ATTACK_TYPE.STREAMBLAST: {
                entity.mResolveStreamblastAttack(gameContext, target, resolver);
                break;
            }
            default: {
                console.error("Unsupported attack type!");
                break;
            }
        }
    }
}

export const AttackAction = function() {
    Action.call(this);

    this.entity = null;
    this.resolutions = [];
}

AttackAction.FLAG = {
    NONE: 0,
    INITIATE: 1 << 0,
    COUNTER: 1 << 1,
    UNCLOAK: 1 << 2,
    BEWEGUNGSKRIEG: 1 << 3
};

AttackAction.prototype = Object.create(Action.prototype);
AttackAction.prototype.constructor = AttackAction;

AttackAction.prototype.onStart = function(gameContext, data, id) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, targetID, resolutions, flags } = data;
    const entity = entityManager.getEntity(entityID);
    const target = entityManager.getEntity(targetID);

    entity.lookAt(target);

    if(FlagHelper.hasFlag(flags, AttackAction.FLAG.COUNTER)) {
        entity.playCounter(gameContext, target);
    } else {
        entity.playAttack(gameContext, target);
    }

    if(FlagHelper.hasFlag(flags, AttackAction.FLAG.UNCLOAK)) {
        entity.uncloakInstant();
    }

    playAttackEffect(gameContext, entity, target, resolutions);

    this.entity = entity;
    this.resolutions = resolutions;
}

AttackAction.prototype.isFinished = function(gameContext, executionRequest) {
    return this.entity.isAnimationFinished();
}

AttackAction.prototype.onEnd = function(gameContext, data, id) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, targetID, flags } = data;
    const target = entityManager.getEntity(targetID);

    for(let i = 0; i < this.resolutions.length; i++) {
        const { entityID, health } = this.resolutions[i];
        const targetObject = entityManager.getEntity(entityID);

        targetObject.setHealth(health);
    }

    this.entity.playIdle(gameContext);


    if(FlagHelper.hasFlag(flags, AttackAction.FLAG.COUNTER)) {
        this.entity.onCounterEnd();
    } else {
        target.setLastAttacker(entityID);

        this.entity.onAttackEnd();

        if(FlagHelper.hasFlag(flags, AttackAction.FLAG.BEWEGUNGSKRIEG)) {
            this.entity.triggerBewegungskrieg();
        }
    }

    this.entity = null;
    this.resolutions = [];
}

AttackAction.prototype.validate = function(gameContext, executionRequest, requestData) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, targetID, command } = requestData;
    const entity = entityManager.getEntity(entityID);
    const target = entityManager.getEntity(targetID);

    if(!entity || !target || !entity.canAttack()) {
        return;
    }

    const resolver = new InteractionResolver();
    let flags = AttackAction.FLAG.NONE;

    switch(command) {
        case COMMAND_TYPE.CHAIN_AFTER_MOVE: {
            if(entity.hasFlag(BattalionEntity.FLAG.HAS_MOVED) && !entity.hasFlag(BattalionEntity.FLAG.HAS_ACTED) && entity.isNextToEntity(target)) {
                resolveFirstAttack(gameContext, entity, target, resolver);
            }

            break;
        }
        case COMMAND_TYPE.INITIATE: {
            if(entity.canAct()) {
               resolveFirstAttack(gameContext, entity, target, resolver);
            }
    
            break;
        }
        case COMMAND_TYPE.COUNTER: {
            resolveCounterAttack(gameContext, entity, target, resolver);
            flags |= AttackAction.FLAG.COUNTER;
            break;
        }
    }

    const hitEntities = resolver.getHitEntities();
    const deadEntities = resolver.getDeadEntities();

    if(hitEntities.length !== 0) {
        if(command !== COMMAND_TYPE.COUNTER && entity.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
            flags = FlagHelper.setFlag(flags, AttackAction.FLAG.UNCLOAK);
        }

        if(deadEntities.length !== 0) {
            if(command !== COMMAND_TYPE.COUNTER && entity.hasTrait(TypeRegistry.TRAIT_TYPE.BEWEGUNGSKRIEG)) {
                flags = FlagHelper.setFlag(flags, AttackAction.FLAG.BEWEGUNGSKRIEG);
            }

            executionRequest.addNext(ActionHelper.createDeathRequest(gameContext, deadEntities));
        }

        executionRequest.addNext(createAttackRequest(targetID, entityID, COMMAND_TYPE.COUNTER));

        executionRequest.setData({
            "entityID": entityID,
            "targetID": targetID,
            "resolutions": hitEntities,
            "flags": flags
        });
    }
}