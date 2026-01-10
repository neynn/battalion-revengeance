import { Action } from "../../../engine/action/action.js";
import { spawnClientEntity, spawnServerEntity } from "../../systems/spawn.js";

export const EntitySpawnAction = function(isServer) {
    Action.call(this);

    this.isServer = isServer;
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
    const { setups, entityMap } = data;
    const count = setups.length;

    for(let i = 0; i < count; i++) {
        const setup = setups[i];
        const entityID = entityMap[i];

        if(this.isServer) {
            spawnServerEntity(gameContext, setup, entityID);
        } else {
            spawnClientEntity(gameContext, setup, entityID);
        }
    }
}

EntitySpawnAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entities } = actionIntent;
    const setups = [];
    const entityMap = [];

    for(let i = 0; i < entities.length; i++) {
        const nextID = entityManager.getNextID();

        setups.push(entities[i]);
        entityMap.push(nextID);
    }

    executionPlan.setData({
        "setups": setups,
        "entityMap": entityMap
    });
}