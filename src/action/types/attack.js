import { Action } from "../../../engine/action/action.js";

export const AttackAction = function() {
    Action.call(this);

    this.entity = null;
    this.targets = [];
}

const Target = function(entityID, state) {
    this.entityID = entityID;
    this.state = state;
}

Target.STATE = {
    ALIVE: 0,
    DEAD: 1
};

AttackAction.prototype = Object.create(Action.prototype);
AttackAction.prototype.constructor = AttackAction;

AttackAction.prototype.onStart = function(gameContext, data, id) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, targetID, targets } = data;
    const entity = entityManager.getEntity(entityID);
    const target = entityManager.getEntity(targetID);

    entity.reduceMove();
    entity.lookAt(gameContext, target);
    entity.toFire(gameContext);
    entity.playFireSound(gameContext);

    this.entity = entity;
}

AttackAction.prototype.onUpdate = function(gameContext, data, id) {}

AttackAction.prototype.isFinished = function(gameContext, executionRequest) {
    const isFinished = this.entity.sprite.parent.hasFinishedOnce();

    return isFinished;
}

AttackAction.prototype.onEnd = function(gameContext, data, id) {
    this.entity.toIdle(gameContext);
    this.entity = null;
}

AttackAction.prototype.getValidated = function(gameContext, requestData) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, targetID } = requestData;
    const entity = entityManager.getEntity(entityID);

    if(entity && entity.hasMoveLeft()) {
        const target = entityManager.getEntity(targetID);

        if(target) {
            return {
                "entityID": entityID,
                "targetID": targetID,
                "targets": [] //These are target resolvers
            }
        }
    }


    return null;
}