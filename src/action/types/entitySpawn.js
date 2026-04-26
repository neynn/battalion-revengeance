import { Action } from "../../../engine/action/action.js";
import { EntityManager } from "../../../engine/entity/entityManager.js";
import { createEntitySnapshot } from "../../snapshot/entitySnapshot.js";

export const EntitySpawnAction = function(createEntity) {
    Action.call(this);

    this._createEntity = createEntity;
}

EntitySpawnAction.createData = function() {
    return {
        "entityID": EntityManager.INVALID_ID,
        "snapshot": createEntitySnapshot()
    }
}

EntitySpawnAction.prototype = Object.create(Action.prototype);
EntitySpawnAction.prototype.constructor = EntitySpawnAction;

EntitySpawnAction.prototype.execute = function(gameContext, data) {
    const { entityID, snapshot } = data;
    const entity = this._createEntity(gameContext, entityID, snapshot);

    //Should never fail...
    if(entity) {
        entity.onTurnStart();
    }
}

EntitySpawnAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { entityManager, mapManager } = world;
    const { snapshot } = actionIntent;
    const worldMap = mapManager.getActiveMap();
    const data = EntitySpawnAction.createData();

    //TODO(neyn): Verify!
    data.entityID = entityManager.getNextID();
    data.snapshot = snapshot;

    executionPlan.setData(data);
}