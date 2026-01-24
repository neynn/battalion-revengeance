import { Action } from "../../../engine/action/action.js";
import { playExplosion } from "../../systems/animation.js";

export const MineTriggerAction = function() {
    Action.call(this);
}

MineTriggerAction.prototype = Object.create(Action.prototype);
MineTriggerAction.prototype.constructor = MineTriggerAction;

MineTriggerAction.prototype.onStart = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, tileX, tileY } = data;
    const entity = entityManager.getEntity(entityID);

    playExplosion(gameContext, tileX, tileY);
}

MineTriggerAction.prototype.isFinished = function(gameContext, executionPlan) {
    return true;
}

MineTriggerAction.prototype.onEnd = function(gameContext, data) {
    this.execute(gameContext, data);
}

MineTriggerAction.prototype.execute = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager, mapManager } = world;
    const { entityID, tileX, tileY } = data;
    const entity = entityManager.getEntity(entityID);
    const worldMap = mapManager.getActiveMap();

    worldMap.removeMine(tileX, tileY);
    //Take damage.
}

MineTriggerAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { entityManager, mapManager } = world;
    const { entityID } = actionIntent;
    const entity = entityManager.getEntity(entityID);

    if(!entity || entity.isDead()) {
        return;
    }

    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return;
    }

    const { tileX, tileY } = entity;
    const mine = worldMap.getMine(tileX, tileY);

    if(!mine || !entity.triggersMine(mine)) {
        return;
    }

    executionPlan.setData({
        "entityID": entityID,
        "tileX": tileX,
        "tileY": tileY
    });
}