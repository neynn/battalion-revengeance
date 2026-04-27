import { Action } from "../../../engine/action/action.js";
import { ActionIntent } from "../../../engine/action/actionIntent.js";
import { EntityManager } from "../../../engine/entity/entityManager.js";
import { WorldMap } from "../../../engine/map/worldMap.js";
import { ACTION_TYPE } from "../../enums.js";
import { playExplosion } from "../../systems/sprite.js";
import { DeathActionVTable } from "./death.js";

const createMineTriggerIntent = function(entityID) {
    return new ActionIntent(ACTION_TYPE.MINE_TRIGGER, {
        "entityID": entityID
    });
}

const createMineTriggerData = function() {
    return {
        "entityID": EntityManager.INVALID_ID,
        "health": 0,
        "tileX": WorldMap.OUT_OF_BOUNDS,
        "tileY": WorldMap.OUT_OF_BOUNDS
    }
}

const fillMineTriggerPlan = function(gameContext, executionPlan, actionIntent) {
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

    const delta = entity.getAttackDelta(damage, 0);
    const health = entity.getHealthFromDelta(delta);

    if(health <= 0) {
        executionPlan.addNext(DeathActionVTable.createIntent([entityID]));
    }

    const data = createMineTriggerData();

    data.entityID = entityID;
    data.health = health;
    data.tileX = tileX;
    data.tileY = tileY;

    executionPlan.setData(data);
}

const executeMineTrigger = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager, mapManager } = world;
    const { entityID, health, tileX, tileY } = data;
    const entity = entityManager.getEntity(entityID);
    const worldMap = mapManager.getActiveMap();

    worldMap.removeMine(tileX, tileY);
    entity.setHealth(health);
}

export const MineTriggerVTable = {
    createIntent: createMineTriggerIntent,
    createData: createMineTriggerData,
    fillPlan: fillMineTriggerPlan,
    execute: executeMineTrigger
};

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

MineTriggerAction.prototype.execute = function(gameContext, data) {
    executeMineTrigger(gameContext, data);
}

MineTriggerAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    fillMineTriggerPlan(gameContext, executionPlan, actionIntent);
}