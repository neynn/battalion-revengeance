import { Action } from "../../../engine/action/action.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";
import { ActionHelper } from "../actionHelper.js";

export const AttackAction = function() {
    Action.call(this);

    this.entity = null;
    this.resolutions = [];
}

AttackAction.ATTACK_TYPE = {
    INITIATE: 0,
    COUNTER: 1
};

AttackAction.RESOLUTION_STATE = {
    ALIVE: 0,
    DEAD: 1
};

AttackAction.prototype = Object.create(Action.prototype);
AttackAction.prototype.constructor = AttackAction;

AttackAction.prototype.onStart = function(gameContext, data, id) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, targetID, resolutions } = data;
    const entity = entityManager.getEntity(entityID);
    const target = entityManager.getEntity(targetID);

    entity.sprite.lockEnd();
    entity.reduceMove();
    entity.lookAt(target);
    entity.playSound(gameContext, BattalionEntity.SOUND_TYPE.FIRE);
    entity.toFire(gameContext);

    this.entity = entity;
    this.resolutions = resolutions;

    for(let i = 0; i < resolutions.length; i++) {
        const { entityID, health } = resolutions[i];
        const targetObject = entityManager.getEntity(entityID);

        targetObject.setHealth(health);
    }
}

AttackAction.prototype.onUpdate = function(gameContext, data, id) {}

AttackAction.prototype.isFinished = function(gameContext, executionRequest) {
    return this.entity.sprite.hasLoopedOnce();
}

AttackAction.prototype.onEnd = function(gameContext, data, id) {
    //If status === dead then teamManager.onEntityDeath();

    this.entity.sprite.unlockEnd();
    this.entity.toIdle(gameContext);
    this.entity = null;
}

AttackAction.prototype.mGetCounterResolutions = function(gameContext, entity, target, resolutions) {
    const { minRange } = entity;
    const maxRange = entity.getMaxRange(gameContext);
    const distance = entity.getDistanceToEntity(target)

    if(!entity.isDead() && !target.isDead()) {
        if(distance >= minRange && distance <= maxRange) {
            const damage = entity.getDamage(gameContext, target, AttackAction.ATTACK_TYPE.COUNTER);
            const remainingHealth = target.getRemainingHealth(damage);

            resolutions.push({
                "entityID": target.getID(),
                "health": remainingHealth
            });
        }
    }
}

AttackAction.prototype.mGetInitiateResolutions = function(gameContext, entity, target, resolutions) {
    const { minRange } = entity;
    const maxRange = entity.getMaxRange(gameContext);
    const distance = entity.getDistanceToEntity(target)

    if(!entity.isDead() && !target.isDead()) {
        if(distance >= minRange && distance <= maxRange) {
            const damage = entity.getDamage(gameContext, target, AttackAction.ATTACK_TYPE.INITIATE);
            const remainingHealth = target.getRemainingHealth(damage);

            resolutions.push({
                "entityID": target.getID(),
                "health": remainingHealth
            });
        }
    }
}

AttackAction.prototype.validate = function(gameContext, executionRequest, requestData) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, targetID, attackType } = requestData;
    const entity = entityManager.getEntity(entityID);
    const target = entityManager.getEntity(targetID);

    if(!entity || !target) {
        return;
    }

    const resolutions = [];

    switch(attackType) {
        case AttackAction.ATTACK_TYPE.INITIATE: {
            if(entity.hasMoveLeft()) {
                this.mGetInitiateResolutions(gameContext, entity, target, resolutions);

                if(resolutions.length !== 0) {
                    //TODO: Check if target can counter -> add counter attack as next.
                    const counterAttack = ActionHelper.createAttackRequest(targetID, entityID, AttackAction.ATTACK_TYPE.COUNTER);

                    executionRequest.addNext(counterAttack);
                }
            }

            break;
        }
        case AttackAction.ATTACK_TYPE.COUNTER: {
            this.mGetCounterResolutions(gameContext, entity, target, resolutions);
            break;
        }
    }

    if(resolutions.length !== 0) {
        executionRequest.setData({
            "entityID": entityID,
            "targetID": targetID,
            "resolutions": resolutions
        });

        const deadEntities = [];

        for(let i = 0; i < resolutions.length; i++) {
            const { entityID, health } = resolutions[i];
            const state = health > 0 ? AttackAction.RESOLUTION_STATE.ALIVE : AttackAction.RESOLUTION_STATE.DEAD;

            if(state === AttackAction.RESOLUTION_STATE.DEAD) {
                deadEntities.push(entityID);
            }
        }

        if(deadEntities.length !== 0) {
            const deathRequest = ActionHelper.createDeathRequest(gameContext, deadEntities);

            executionRequest.addNext(deathRequest);
        }
    }
}