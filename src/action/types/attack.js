import { Action } from "../../../engine/action/action.js";
import { FlagHelper } from "../../../engine/flagHelper.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";
import { TypeRegistry } from "../../type/typeRegistry.js";
import { ActionHelper } from "../actionHelper.js";
import { AttackResolver } from "./attackResolver.js";

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

AttackAction.ATTACK_TYPE = {
    INITIATE: 0,
    COUNTER: 1
};

AttackAction.COMMAND = {
    INITIATE: 0,
    COUNTER: 1,
    CHAIN_AFTER_MOVE: 2
};

AttackAction.prototype = Object.create(Action.prototype);
AttackAction.prototype.constructor = AttackAction;

AttackAction.prototype.onStart = function(gameContext, data, id) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, targetID, resolutions, attackType, flags } = data;
    const entity = entityManager.getEntity(entityID);
    const target = entityManager.getEntity(targetID);

    entity.lookAt(target);

    switch(attackType) {
        case AttackAction.ATTACK_TYPE.INITIATE: {
            entity.playAttack(gameContext, target);
            break;
        }
        case AttackAction.ATTACK_TYPE.COUNTER: {
            entity.playCounter(gameContext, target);
            break;
        }
    }

    if(FlagHelper.hasFlag(flags, AttackAction.FLAG.UNCLOAK)) {
        entity.uncloakInstant();
    }

    this.entity = entity;
    this.resolutions = resolutions;
}

AttackAction.prototype.isFinished = function(gameContext, executionRequest) {
    return this.entity.isAnimationFinished();
}

AttackAction.prototype.onEnd = function(gameContext, data, id) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, targetID, attackType, flags } = data;
    const target = entityManager.getEntity(targetID);

    for(let i = 0; i < this.resolutions.length; i++) {
        const { entityID, health } = this.resolutions[i];
        const targetObject = entityManager.getEntity(entityID);

        targetObject.setHealth(health);
    }

    this.entity.playIdle(gameContext);

    switch(attackType) {
        case AttackAction.ATTACK_TYPE.INITIATE: {
            target.onAttackReceived(gameContext, entityID);

            this.entity.onAttackEnd(gameContext);

            if(FlagHelper.hasFlag(flags, AttackAction.FLAG.BEWEGUNGSKRIEG)) {
                this.entity.triggerBewegungskrieg();
            }

            break;
        }
        case AttackAction.ATTACK_TYPE.COUNTER: {
            this.entity.onCounterEnd(gameContext);
            break;
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

    const resolver = new AttackResolver();
    let flags = AttackAction.FLAG.NONE;
    let attackType = AttackAction.ATTACK_TYPE.INITIATE;

    switch(command) {
        case AttackAction.COMMAND.CHAIN_AFTER_MOVE: {
            if(entity.hasFlag(BattalionEntity.FLAG.HAS_MOVED) && !entity.hasFlag(BattalionEntity.FLAG.HAS_ATTACKED) && entity.isNextToEntity(target)) {
                entity.mGetInitiateResolutions(gameContext, target, resolver);
            }

            break;
        }
        case AttackAction.COMMAND.INITIATE: {
            if(entity.canAct()) {
               entity.mGetInitiateResolutions(gameContext, target, resolver);
            }
    
            break;
        }
        case AttackAction.COMMAND.COUNTER: {
            entity.mGetCounterResolutions(gameContext, target, resolver);
            attackType = AttackAction.ATTACK_TYPE.COUNTER;
            break;
        }
    }

    const hitEntities = resolver.getHitEntities();
    const deadEntities = resolver.getDeadEntities();

    if(hitEntities.length !== 0) {
        if(command !== AttackAction.COMMAND.COUNTER && entity.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
            flags = FlagHelper.setFlag(flags, AttackAction.FLAG.UNCLOAK);
        }

        if(deadEntities.length !== 0) {
            if(command !== AttackAction.COMMAND.COUNTER && entity.hasTrait(TypeRegistry.TRAIT_TYPE.BEWEGUNGSKRIEG)) {
                flags = FlagHelper.setFlag(flags, AttackAction.FLAG.BEWEGUNGSKRIEG);
            }

            executionRequest.addNext(ActionHelper.createDeathRequest(gameContext, deadEntities));
        }

        executionRequest.addNext(ActionHelper.createAttackRequest(targetID, entityID, AttackAction.COMMAND.COUNTER));

        executionRequest.setData({
            "entityID": entityID,
            "targetID": targetID,
            "resolutions": hitEntities,
            "attackType": attackType,
            "flags": flags
        });
    }
}