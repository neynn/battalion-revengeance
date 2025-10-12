import { Action } from "../../../engine/action/action.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";
import { ActionHelper } from "../actionHelper.js";

export const AttackAction = function() {
    Action.call(this);

    this.entity = null;
    this.targets = [];
}

AttackAction.ATTACK_TYPE = {
    INITIATE: 0,
    COUNTER: 1
};

AttackAction.prototype = Object.create(Action.prototype);
AttackAction.prototype.constructor = AttackAction;

AttackAction.prototype.onStart = function(gameContext, data, id) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, targetID, targets } = data;
    const entity = entityManager.getEntity(entityID);
    const target = entityManager.getEntity(targetID);

    entity.sprite.lockEnd();
    entity.reduceMove();
    entity.lookAt(target);
    entity.playSound(gameContext, BattalionEntity.SOUND_TYPE.FIRE);
    entity.toFire(gameContext);

    this.entity = entity;
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

AttackAction.prototype.validate = function(gameContext, executionRequest, requestData) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, targetID, attackType } = requestData;
    const entity = entityManager.getEntity(entityID);
    const target = entityManager.getEntity(targetID);

    if(!entity || !target) {
        return;
    }

    switch(attackType) {
        case AttackAction.ATTACK_TYPE.INITIATE: {
            if(entity.hasMoveLeft() && entity.isEntityInRange(target)) {
                executionRequest.setData({
                    "entityID": entityID,
                    "targetID": targetID,
                    "targets": [] //These are target resolvers
                });

                //TODO: Check if target can counter -> add counter attack as next.
                const counterAttack = ActionHelper.createAttackRequest(targetID, entityID, AttackAction.ATTACK_TYPE.COUNTER);

                executionRequest.addNext(counterAttack);
            }

            break;
        }
        case AttackAction.ATTACK_TYPE.COUNTER: {
            if(entity.isEntityInRange(target)) {
                executionRequest.setData({
                    "entityID": entityID,
                    "targetID": targetID,
                    "targets": [] //These are target resolvers
                });
            }

            break;
        }
    }
}