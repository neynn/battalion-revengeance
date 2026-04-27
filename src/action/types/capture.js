import { Action } from "../../../engine/action/action.js";
import { ActionIntent } from "../../../engine/action/actionIntent.js";
import { EntityManager } from "../../../engine/entity/entityManager.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";
import { ACTION_TYPE, TEAM_STAT } from "../../enums.js";
import { updateBuildingSprite } from "../../systems/sprite.js";

const createCaptureIntent = function(entityID, targetX, targetY) {
    return new ActionIntent(ACTION_TYPE.CAPTURE, {
        "entityID": entityID,
        "targetX": targetX,
        "targetY": targetY
    });
}

const createCaptureData = function() {
    return {
        "entityID": EntityManager.INVALID_ID,
        "targetX": -1,
        "targetY": -1
    }
}

const fillCapturePlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, targetX, targetY } = actionIntent;
    const entity = entityManager.getEntity(entityID);

    if(!entity || entity.isDead()) {
        return;
    }

    if(!entity.hasFlag(BattalionEntity.FLAG.HAS_MOVED) || entity.getDistanceToTile(targetX, targetY) !== 0) {
        return;
    }

    if(!entity.canCapture(gameContext, targetX, targetY)) {
        return;
    }

    const data = createCaptureData();

    data.entityID = entityID;
    data.targetX = targetX;
    data.targetY = targetY;

    executionPlan.setData(data);
}

const executeCapture = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager, mapManager } = world;
    const { entityID, targetX, targetY } = data;
    const worldMap = mapManager.getActiveMap();
    const entity = entityManager.getEntity(entityID);
    const building = worldMap.getBuilding(targetX, targetY);
    const nextTeam = entity.getTeam(gameContext);
    const previousTeam = building.getTeam(gameContext);

    if(previousTeam) {
        previousTeam.addStatistic(TEAM_STAT.STRUCTURES_LOST, 1);
    }

    nextTeam.addStatistic(TEAM_STAT.STRUCTURES_CAPTURED, 1);
    building.setTeam(entity.teamID);
    building.setColor(nextTeam.color);
}

export const CaptureActionVTable = {
    createIntent: createCaptureIntent,
    createData: createCaptureData,
    fillPlan: fillCapturePlan,
    execute: executeCapture
};

export const CaptureAction = function() {
    Action.call(this);
}

CaptureAction.prototype = Object.create(Action.prototype);
CaptureAction.prototype.constructor = CaptureAction;

CaptureAction.prototype.onEnd = function(gameContext, data) {
    const { world } = gameContext;
    const { mapManager } = world;
    const { targetX, targetY } = data;
    const worldMap = mapManager.getActiveMap();
    const building = worldMap.getBuilding(targetX, targetY);

    updateBuildingSprite(gameContext, building);
}