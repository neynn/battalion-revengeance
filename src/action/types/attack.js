import { Action } from "../../../engine/action/action.js";
import { FlagHelper } from "../../../engine/flagHelper.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";
import { TypeRegistry } from "../../type/typeRegistry.js";
import { ActionHelper } from "../actionHelper.js";

const mGetDeadEntities = function(resolutions, deadEntities) {
    for(let i = 0; i < resolutions.length; i++) {
        const { entityID, health } = resolutions[i];

        if(health <= 0) {
            deadEntities.push(entityID);
        }
    }
}

const mGetCounterResolutions = function(gameContext, entity, target, resolutions) {
    if(entity.isAllowedToCounter(target) && entity.canTarget(gameContext, target)) {
        const damage = entity.getDamage(gameContext, target, AttackAction.ATTACK_TYPE.COUNTER);
        const remainingHealth = target.getHealthAfter(damage);
        const targetID = target.getID();

        resolutions.push({
            "entityID": targetID,
            "health": remainingHealth
        });

        if(entity.hasTrait(TypeRegistry.TRAIT_TYPE.OVERHEAT)) {
            const entityID = entity.getID();
            const overheatDamage = entity.getOverheatDamage();
            const overheatHealth = entity.getHealthAfter(overheatDamage);

            resolutions.push({
                "entityID": entityID,
                "health": overheatHealth
            });
        } else if(entity.hasTrait(TypeRegistry.TRAIT_TYPE.ABSORBER)) {
            const entityID = entity.getID();
            const absorberHealth = entity.getAbsorberHealth(damage);

            resolutions.push({
                "entityID": entityID,
                "health": absorberHealth
            });
        }
    }
}

const mGetInitiateResolutions = function(gameContext, entity, target, resolutions) {
    if(entity.canTarget(gameContext, target)) {
        const damage = entity.getDamage(gameContext, target, AttackAction.ATTACK_TYPE.INITIATE);
        const remainingHealth = target.getHealthAfter(damage);
        const targetID = target.getID();

        resolutions.push({
            "entityID": targetID,
            "health": remainingHealth
        });

        if(entity.hasTrait(TypeRegistry.TRAIT_TYPE.SELF_DESTRUCT)) {
            const entityID = entity.getID();

            resolutions.push({
                "entityID": entityID,
                "health": 0
            });
        } else if(entity.hasTrait(TypeRegistry.TRAIT_TYPE.OVERHEAT)) {
            const entityID = entity.getID();
            const overheatDamage = entity.getOverheatDamage();
            const overheatHealth = entity.getHealthAfter(overheatDamage);

            resolutions.push({
                "entityID": entityID,
                "health": overheatHealth
            });
        } else if(entity.hasTrait(TypeRegistry.TRAIT_TYPE.ABSORBER)) {
            const entityID = entity.getID();
            const absorberHealth = entity.getAbsorberHealth(damage);

            resolutions.push({
                "entityID": entityID,
                "health": absorberHealth
            });
        }
    }
}

const createWeaponSprite = function(gameContext, entity, target) {
    const { spriteManager, transform2D } = gameContext;
    const attackEffect = entity.getAttackSprite();
    const sprite = spriteManager.createSprite(attackEffect, TypeRegistry.LAYER_TYPE.GFX);

    if(sprite) {
        const { tileX, tileY } = target;
        const { x, y } = transform2D.transformTileToWorld(tileX, tileY);

        sprite.setPosition(x, y);
        sprite.expire();
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
            entity.playAttack(gameContext);
            break;
        }
        case AttackAction.ATTACK_TYPE.COUNTER: {
            entity.playCounter(gameContext);
            break;
        }
    }

    createWeaponSprite(gameContext, entity, target);

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

    let flags = AttackAction.FLAG.NONE;
    let attackType = AttackAction.ATTACK_TYPE.INITIATE;
    const resolutions = [];
    const deadEntities = [];

    switch(command) {
        case AttackAction.COMMAND.CHAIN_AFTER_MOVE: {
            if(entity.hasFlag(BattalionEntity.FLAG.HAS_MOVED) && !entity.hasFlag(BattalionEntity.FLAG.HAS_ATTACKED) && !entity.isRanged()) {
                mGetInitiateResolutions(gameContext, entity, target, resolutions);
                mGetDeadEntities(resolutions, deadEntities);

                if(resolutions.length !== 0) {
                    if(entity.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
                        flags = FlagHelper.setFlag(flags, AttackAction.FLAG.UNCLOAK);
                    }

                    if(entity.hasTrait(TypeRegistry.TRAIT_TYPE.BEWEGUNGSKRIEG) && deadEntities.length !== 0) {
                        flags = FlagHelper.setFlag(flags, AttackAction.FLAG.BEWEGUNGSKRIEG);
                    }

                    executionRequest.addNext(ActionHelper.createAttackRequest(targetID, entityID, AttackAction.COMMAND.COUNTER));
                }
            }

            break;
        }
        case AttackAction.COMMAND.INITIATE: {
            if(entity.canAct()) {
                mGetInitiateResolutions(gameContext, entity, target, resolutions);
                mGetDeadEntities(resolutions, deadEntities);

                if(resolutions.length !== 0) {
                    if(entity.hasFlag(BattalionEntity.FLAG.IS_CLOAKED)) {
                        flags = FlagHelper.setFlag(flags, AttackAction.FLAG.UNCLOAK);
                    }

                    if(entity.hasTrait(TypeRegistry.TRAIT_TYPE.BEWEGUNGSKRIEG) && deadEntities.length !== 0) {
                        flags = FlagHelper.setFlag(flags, AttackAction.FLAG.BEWEGUNGSKRIEG);
                    }

                    executionRequest.addNext(ActionHelper.createAttackRequest(targetID, entityID, AttackAction.COMMAND.COUNTER));
                }
            }
    
            break;
        }
        case AttackAction.COMMAND.COUNTER: {
            mGetCounterResolutions(gameContext, entity, target, resolutions);
            mGetDeadEntities(resolutions, deadEntities);

            attackType = AttackAction.ATTACK_TYPE.COUNTER;
            break;
        }
    }

    if(resolutions.length !== 0) {
        if(deadEntities.length !== 0) {
            executionRequest.addNext(ActionHelper.createDeathRequest(gameContext, deadEntities));
        }

        executionRequest.setData({
            "entityID": entityID,
            "targetID": targetID,
            "resolutions": resolutions,
            "attackType": attackType,
            "flags": flags
        });
    }
}