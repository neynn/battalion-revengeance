import { Action } from "../../../engine/action/action.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";
import { TEAM_STAT } from "../../enums.js";

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
    const { entityManager } = world;
    const { entityID, value } = data;
    const entity = entityManager.getEntity(entityID);
    const team = entity.getTeam(gameContext);

    entity.addCash(value);
    entity.setFlag(BattalionEntity.FLAG.HAS_FIRED);
    entity.extractOre(gameContext);
    team.addStatistic(TEAM_STAT.ORE_EXTRACTED, value);
}

ExtractAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID } = actionIntent;
    const entity = entityManager.getEntity(entityID);

    if(entity && !entity.isDead() && entity.canAct() && entity.canExtract()) {
        const oreValue = entity.getOreValue(gameContext);

        if(oreValue > 0) {
            executionPlan.setData({
                "entityID": entityID,
                "value": oreValue
            });
        }
    }
}