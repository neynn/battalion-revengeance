import { Action } from "../../../engine/action/action.js";
import { createEntitySnapshotFromJSON } from "../../snapshot/entitySnapshot.js";

export const EntitySpawnAction = function(createEntity) {
    Action.call(this);

    this._createEntity = createEntity;
}

EntitySpawnAction.createData = function() {
    return {
        "spawns": []
    }
}

EntitySpawnAction.prototype = Object.create(Action.prototype);
EntitySpawnAction.prototype.constructor = EntitySpawnAction;

EntitySpawnAction.prototype.isFinished = function(gameContext, executionPlan) {
    return true;
}

EntitySpawnAction.prototype.onEnd = function(gameContext, data) {
    this.execute(gameContext, data);
}

EntitySpawnAction.prototype.execute = function(gameContext, data) {
    const { spawns } = data;

    for(const { id, snapshot } of spawns) {
        this._createEntity(gameContext, id, snapshot);
    }
}

EntitySpawnAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { entityManager, mapManager } = world;
    const { entities } = actionIntent;
    const worldMap = mapManager.getActiveMap();
    const data = EntitySpawnAction.createData();

    for(let i = 0; i < entities.length; i++) {
        const nextID = entityManager.getNextID();
        const snapshot = createEntitySnapshotFromJSON(gameContext, worldMap, entities[i]);

        data.spawns.push({
            "id": nextID,
            "snapshot": snapshot
        });
    }

    executionPlan.setData(data);
}