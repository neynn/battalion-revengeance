import { Action } from "../../../engine/action/action.js";
import { EntityManager } from "../../../engine/entity/entityManager.js";
import { TEAM_STAT, TRAIT_TYPE } from "../../enums.js";

export const ExtractAction = function() {
    Action.call(this);
}

ExtractAction.createData = function() {
    return {
        "entityID": EntityManager.INVALID_ID,
        "value": 0
    }
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
    entity.setActed();
    entity.extractOre(gameContext);
    team.addStatistic(TEAM_STAT.ORE_EXTRACTED, value);
}

ExtractAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID } = actionIntent;
    const entity = entityManager.getEntity(entityID);

    if(!entity || entity.isDead() || !entity.canActAndMove() || !entity.hasTrait(TRAIT_TYPE.EXTRACTOR)) {
        return;
    }

    const oreValue = entity.getOreValue(gameContext);

    if(oreValue <= 0) {
        return;
    }

    const data = ExtractAction.createData();

    data.entityID = entityID;
    data.value = Math.floor(oreValue);

    executionPlan.setData(data);
}