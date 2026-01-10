import { Action } from "../../../engine/action/action.js";

export const EntitySpawnAction = function() {
    Action.call(this);
}

EntitySpawnAction.prototype = Object.create(Action.prototype);
EntitySpawnAction.prototype.constructor = EntitySpawnAction;

EntitySpawnAction.prototype.onStart = function(gameContext, data) {}

EntitySpawnAction.prototype.isFinished = function(gameContext, executionPlan) {
    return true;
}

EntitySpawnAction.prototype.onEnd = function(gameContext, data) {
    this.execute(gameContext, data);
}

EntitySpawnAction.prototype.execute = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entities } = data;

    //TODO: Create correct entity.
}

EntitySpawnAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entities } = actionIntent;

    if(!entityManager.hasEntity()) {
        executionPlan.setData({
            "entities": entities
        });
    }
}