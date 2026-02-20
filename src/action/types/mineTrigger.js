import { Action } from "../../../engine/action/action.js";
import { playExplosion } from "../../systems/animation.js";
import { createDeathIntent } from "../actionHelper.js";

export const MineTriggerAction = function() {
    Action.call(this);
}

MineTriggerAction.prototype = Object.create(Action.prototype);
MineTriggerAction.prototype.constructor = MineTriggerAction;

MineTriggerAction.prototype.onStart = function(gameContext, data) {
    const { entityID, health, tileX, tileY } = data;

    //Ensures that only one explosion is played: Either death or the mine.
    if(health > 0) {
        playExplosion(gameContext, tileX, tileY);
    }
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
    const { entityID, health, tileX, tileY } = data;
    const entity = entityManager.getEntity(entityID);
    const worldMap = mapManager.getActiveMap();

    worldMap.removeMine(tileX, tileY);
    entity.setHealth(health);
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

    if(!mine || !entity.triggersMine(gameContext, mine)) {
        return;
    }

    const damage = mine.getDamage(entity.config.movementType);

    if(damage === 0) {
        return;
    }

    const health = entity.getHealthAfterDamage(damage);

    if(health <= 0) {
        executionPlan.addNext(createDeathIntent([entityID]));
    }

    executionPlan.setData({
        "entityID": entityID,
        "health": health,
        "tileX": tileX,
        "tileY": tileY
    });
}