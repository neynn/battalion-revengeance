import { Action } from "../../../engine/action/action.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";

export const CaptureAction = function() {
    Action.call(this);

    this.entity = null;
    this.building = null;
}

CaptureAction.prototype = Object.create(Action.prototype);
CaptureAction.prototype.constructor = CaptureAction;

CaptureAction.prototype.onStart = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager, mapManager } = world;
    const { entityID, targetX, targetY } = data;
    const worldMap = mapManager.getActiveMap();
    const entity = entityManager.getEntity(entityID);
    const building = worldMap.getBuilding(targetX, targetY);

    this.entity = entity;
    this.building = building;
}

CaptureAction.prototype.isFinished = function(gameContext, executionPlan) {
    return true;
}

CaptureAction.prototype.onEnd = function(gameContext, data) {
    this.building.updateTeam(gameContext, this.entity.teamID); //TODO: Evil.
    //Broadcast capture update to team.

    this.entity = null;
    this.building = null;
}

CaptureAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, targetX, targetY } = actionIntent;
    const entity = entityManager.getEntity(entityID);

    //Only allow capture if entity landed on tile.
    if(entity && !entity.isDead() && entity.hasFlag(BattalionEntity.FLAG.HAS_MOVED) && entity.getDistanceToTile(targetX, targetY) === 0) {
        if(entity.canCapture(gameContext, targetX, targetY)) {
            executionPlan.setData({
                "entityID": entityID,
                "targetX": targetX,
                "targetY": targetY
            });
        }
    }
}