import { Action } from "../../../engine/action/action.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";

export const AttackAction = function() {
    Action.call(this);

    this.entity = null;
    this.targets = [];
}

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
    const { entityID, targetID } = requestData;
    const entity = entityManager.getEntity(entityID);

    if(entity && entity.hasMoveLeft()) {
        const target = entityManager.getEntity(targetID);

        if(target && entity.isEntityInRange(target)) {
            executionRequest.setData({
                "entityID": entityID,
                "targetID": targetID,
                "targets": [] //These are target resolvers
            });
        }
    }
}