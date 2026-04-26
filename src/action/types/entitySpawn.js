import { Action } from "../../../engine/action/action.js";
import { ActionIntent } from "../../../engine/action/actionIntent.js";
import { EntityManager } from "../../../engine/entity/entityManager.js";
import { ACTION_TYPE } from "../../enums.js";
import { createEntitySnapshot } from "../../snapshot/entitySnapshot.js";
import { createClientEntityObject, createServerEntityObject } from "../../systems/spawn.js";

const createEntitySpawnIntent = function(snapshot) {
    return new ActionIntent(ACTION_TYPE.ENTITY_SPAWN, {
        "snapshot": snapshot
    });
}

const createEntitySpawnData = function() {
    return {
        "entityID": EntityManager.INVALID_ID,
        "snapshot": createEntitySnapshot()
    }
}

const fillEntitySpawnPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { entityManager, mapManager } = world;
    const { snapshot } = actionIntent;
    const worldMap = mapManager.getActiveMap();
    const data = createEntitySpawnData();

    //TODO(neyn): Verify!
    data.entityID = entityManager.getNextID();
    data.snapshot = snapshot;

    executionPlan.setData(data);
}

const executeEntitySpawn = function(gameContext, data) {
    const { isClient } = gameContext;
    const { entityID, snapshot } = data;
    let entity = null;

    if(isClient) {
        entity = createClientEntityObject(gameContext, entityID, snapshot);
    } else {
        entity = createServerEntityObject(gameContext, entityID, snapshot);
    }

    //Should never fail...
    if(entity) {
        entity.onTurnStart();
    }
}

export const EntitySpawnVTable = {
    createIntent: createEntitySpawnIntent,
    createData: createEntitySpawnData,
    fillPlan: fillEntitySpawnPlan,
    execute: executeEntitySpawn
};

export const EntitySpawnAction = function() {
    Action.call(this);
}

EntitySpawnAction.prototype = Object.create(Action.prototype);
EntitySpawnAction.prototype.constructor = EntitySpawnAction;

EntitySpawnAction.prototype.execute = function(gameContext, data) {
    executeEntitySpawn(gameContext, data);
}

EntitySpawnAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    fillEntitySpawnPlan(gameContext, executionPlan, actionIntent);
}