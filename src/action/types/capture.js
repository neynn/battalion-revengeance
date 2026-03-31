import { Action } from "../../../engine/action/action.js";
import { EntityManager } from "../../../engine/entity/entityManager.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";
import { TEAM_STAT } from "../../enums.js";
import { updateBuildingSprite } from "../../systems/sprite.js";

export const CaptureAction = function() {
    Action.call(this);
}

CaptureAction.createData = function() {
    return {
        "entityID": EntityManager.INVALID_ID,
        "targetX": -1,
        "targetY": -1
    }
}

CaptureAction.prototype = Object.create(Action.prototype);
CaptureAction.prototype.constructor = CaptureAction;

CaptureAction.prototype.isFinished = function(gameContext, executionPlan) {
    return true;
}

CaptureAction.prototype.onEnd = function(gameContext, data) {
    this.execute(gameContext, data);
}

CaptureAction.prototype.execute = function(gameContext, data) {
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

    updateBuildingSprite(gameContext, building);
}

CaptureAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
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

    const data = CaptureAction.createData();

    data.entityID = entityID;
    data.targetX = targetX;
    data.targetY = targetY;

    executionPlan.setData(data);
}