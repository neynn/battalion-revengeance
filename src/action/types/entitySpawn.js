import { Action } from "../../../engine/action/action.js";
import { createEntitySnapshotFromJSON } from "../../snapshot/entitySnapshot.js";

export const EntitySpawnAction = function(createEntity) {
    Action.call(this);

    this._createEntity = createEntity;
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
    const { entityManager } = world;
    const { entities } = actionIntent;
    const spawns = [];

    for(let i = 0; i < entities.length; i++) {
        const nextID = entityManager.getNextID();
        const snapshot = createEntitySnapshotFromJSON(gameContext, entities[i]);

        spawns.push({
            "id": nextID,
            "snapshot": snapshot
        });
    }

    executionPlan.setData({
        "spawns": spawns
    });
}