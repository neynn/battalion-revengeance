import { Action } from "../../../engine/action/action.js";
import { ActionIntent } from "../../../engine/action/actionIntent.js";
import { EntityManager } from "../../../engine/entity/entityManager.js";
import { ACTION_TYPE, TEAM_STAT, TERRAIN_TYPE, TRAIT_TYPE } from "../../enums.js";

const createExtractIntent = function(entityID) {
    return new ActionIntent(ACTION_TYPE.EXTRACT, {
        "entityID": entityID
    });
}

const createExtractData = function() {
    return {
        "entityID": EntityManager.INVALID_ID,
        "value": 0
    }
}

const fillExtractPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { entityManager, mapManager } = world;
    const { entityID } = actionIntent;
    const entity = entityManager.getEntity(entityID);

    if(!entity || entity.isDead() || !entity.isAllowedToActAndMove() || !entity.hasTrait(TRAIT_TYPE.EXTRACTOR)) {
        return;
    }

    const { tileX, tileY } = entity;
    const worldMap = mapManager.getActiveMap();
    const tileType = worldMap.getTileType(gameContext, tileX, tileY);

    if(!tileType.hasTerrain(TERRAIN_TYPE.EXTRACTABLE)) {
        return;
    }

    const data = createExtractData();

    data.entityID = entityID;
    data.value = tileType.resources;

    executionPlan.setData(data);
}

const executeExtract = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager, mapManager } = world;
    const { entityID, value } = data;

    const worldMap = mapManager.getActiveMap();
    const entity = entityManager.getEntity(entityID);
    const team = entity.getTeam(gameContext);
    const { tileX, tileY } = entity;

    entity.addCash(value);
    entity.consumeAct();
    worldMap.downgradeOreTile(tileX, tileY);
    team.addStatistic(TEAM_STAT.ORE_EXTRACTED, value);
}

export const ExtractVTable = {
    createIntent: createExtractIntent,
    createData: createExtractData,
    fillPlan: fillExtractPlan,
    execute: executeExtract
};

export const ExtractAction = function() {
    Action.call(this);
}

ExtractAction.prototype = Object.create(Action.prototype);
ExtractAction.prototype.constructor = ExtractAction;