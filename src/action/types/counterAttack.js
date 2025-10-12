import { Action } from "../../../engine/action/action.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";

export const CounterAttackAction = function() {
    Action.call(this);

    this.entity = null;
    this.targets = [];
}

CounterAttackAction.prototype = Object.create(Action.prototype);
CounterAttackAction.prototype.constructor = CounterAttackAction;

CounterAttackAction.prototype.onStart = function(gameContext, data, id) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, targetID, targets } = data;
}

CounterAttackAction.prototype.onUpdate = function(gameContext, data, id) {}

CounterAttackAction.prototype.isFinished = function(gameContext, executionRequest) {
    return this.entity.sprite.hasLoopedOnce();
}

CounterAttackAction.prototype.onEnd = function(gameContext, data, id) {    
    this.entity.sprite.unlockEnd();
    this.entity.toIdle(gameContext);
    this.entity = null;
}

CounterAttackAction.prototype.getValidated = function(gameContext, requestData) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, targetID } = requestData;
    const entity = entityManager.getEntity(entityID);

    if(entity && entity.hasMoveLeft()) {
        const target = entityManager.getEntity(targetID);

        if(target && entity.isEntityInRange(target)) {
            return {
                "entityID": entityID,
                "targetID": targetID,
                "targets": [] //These are target resolvers
            }
        }
    }


    return null;
}