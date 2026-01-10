import { Action } from "../../../engine/action/action.js";
import { hasFlag } from "../../../engine/util/flag.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";
import { ATTACK_TYPE, COMMAND_TYPE } from "../../enums.js";
import { playAttackEffect } from "../../systems/animation.js";
import { TypeRegistry } from "../../type/typeRegistry.js";
import { createAttackRequest, createDeathIntent } from "../actionHelper.js";
import { InteractionResolver } from "./interactionResolver.js";

const resolveCounterAttack = function(gameContext, entity, target, resolver) {
    if(entity.isCounterValid(target) && entity.isAttackValid(gameContext, target) && entity.isAttackPositionValid(gameContext, target)) {
        entity.mResolveCounterAttack(gameContext, target, resolver);
    }
}

const resolveFirstAttack = function(gameContext, entity, target, resolver) {
    if(entity.isAttackValid(gameContext, target) && entity.isAttackPositionValid(gameContext, target)) {
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

    this.duration = 0;
    this.passedTime = 0;
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

AttackAction.prototype.onStart = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, targetID, resolutions, flags } = data;
    const entity = entityManager.getEntity(entityID);
    const target = entityManager.getEntity(targetID);

    entity.lookAt(target);

    if(hasFlag(flags, AttackAction.FLAG.COUNTER)) {
        entity.playCounter(gameContext, target);
    } else {
        entity.playAttack(gameContext, target);
    }

    if(hasFlag(flags, AttackAction.FLAG.UNCLOAK)) {
        entity.setOpacity(1);
    }

    playAttackEffect(gameContext, entity, target, resolutions);

    this.duration = entity.getAnimationDuration();
}

AttackAction.prototype.onUpdate = function(gameContext, data) {
    const { timer } = gameContext;
    const deltaTime = timer.getFixedDeltaTime();

    this.passedTime += deltaTime;
}
 
AttackAction.prototype.isFinished = function(gameContext, executionPlan) {
    return this.passedTime >= this.duration;
}

AttackAction.prototype.onEnd = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID } = data;
    const entity = entityManager.getEntity(entityID);

    entity.playIdle(gameContext);

    this.execute(gameContext, data);
    this.duration = 0;
    this.passedTime = 0;
}

AttackAction.prototype.execute = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, targetID, resolutions, flags } = data;
    const entity = entityManager.getEntity(entityID);
    const target = entityManager.getEntity(targetID);

    for(let i = 0; i < resolutions.length; i++) {
        const { entityID, health } = resolutions[i];
        const targetObject = entityManager.getEntity(entityID);

        targetObject.setHealth(health);
    }

    if(hasFlag(flags, AttackAction.FLAG.UNCLOAK)) {
        entity.clearFlag(BattalionEntity.FLAG.IS_CLOAKED);
    }

    if(hasFlag(flags, AttackAction.FLAG.COUNTER)) {
        entity.clearLastAttacker();
    } else {
        target.setLastAttacker(entityID);

        entity.setFlag(BattalionEntity.FLAG.HAS_FIRED);

        if(hasFlag(flags, AttackAction.FLAG.BEWEGUNGSKRIEG)) {
            entity.triggerBewegungskrieg();
        }
    }
}

AttackAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, targetID, command } = actionIntent;
    const entity = entityManager.getEntity(entityID);
    const target = entityManager.getEntity(targetID);

    if(!entity || !target) {
        return;
    }

    const resolver = new InteractionResolver();
    let flags = AttackAction.FLAG.NONE;

    switch(command) {
        case COMMAND_TYPE.CHAIN_AFTER_MOVE: {
            if(entity.hasFlag(BattalionEntity.FLAG.HAS_MOVED) && !entity.hasFlag(BattalionEntity.FLAG.HAS_FIRED) && entity.isNextToEntity(target)) {
                resolveFirstAttack(gameContext, entity, target, resolver);
            }

            break;
        }
        case COMMAND_TYPE.INITIATE: {
            if(entity.hasFlag(BattalionEntity.FLAG.CAN_MOVE) && !entity.hasFlag(BattalionEntity.FLAG.HAS_FIRED)) {
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
        if(deadEntities.length !== 0) {
            executionPlan.addNext(createDeathIntent(gameContext, deadEntities));
        }               

        if(command !== COMMAND_TYPE.COUNTER) {
            if(entity.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
                flags |= AttackAction.FLAG.UNCLOAK;
            } 

            if(deadEntities.length !== 0) {
                if(entity.hasTrait(TypeRegistry.TRAIT_TYPE.BEWEGUNGSKRIEG)) {
                    flags |= AttackAction.FLAG.BEWEGUNGSKRIEG;
                }
            }
        }

        executionPlan.addNext(createAttackRequest(targetID, entityID, COMMAND_TYPE.COUNTER));

        executionPlan.setData({
            "entityID": entityID,
            "targetID": targetID,
            "resolutions": hitEntities,
            "flags": flags
        });
    }
}