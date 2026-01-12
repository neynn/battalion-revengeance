import { Action } from "../../../engine/action/action.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";

export const ExtractAction = function() {
    Action.call(this);
}

ExtractAction.prototype = Object.create(Action.prototype);
ExtractAction.prototype.constructor = ExtractAction;

ExtractAction.prototype.isFinished = function(gameContext, executionPlan) {
    return true;
}

ExtractAction.prototype.onEnd = function(gameContext, data) {
    this.execute(gameContext, data);
}

ExtractAction.prototype.execute = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager, mapManager } = world;
    const { entityID, value } = data;
    const entity = entityManager.getEntity(entityID);
    const worldMap = mapManager.getActiveMap();
    const { tileX, tileY } = entity;

    worldMap.extractOre(gameContext, tileX, tileY);
    entity.addCash(value);
    entity.setFlag(BattalionEntity.FLAG.HAS_FIRED);
}

ExtractAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { entityManager, mapManager } = world;
    const { entityID} = actionIntent;
    const entity = entityManager.getEntity(entityID);
    const worldMap = mapManager.getActiveMap();

    if(entity && !entity.isDead() && entity.canAct()) {
        if(entity.canExtract()) {
            const { tileX, tileY } = entity;
            const oreValue = worldMap.getOreValue(gameContext, tileX, tileY);

            if(oreValue > 0) {
                executionPlan.setData({
                    "entityID": entityID,
                    "value": oreValue
                });
            }
        }
    }
}