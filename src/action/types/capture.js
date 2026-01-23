import { Action } from "../../../engine/action/action.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";
import { TEAM_STAT } from "../../enums.js";

export const CaptureAction = function() {
    Action.call(this);
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
        previousTeam.removeBuilding(building);
    }

    nextTeam.addStatistic(TEAM_STAT.STRUCTURES_CAPTURED, 1);
    nextTeam.addBuilding(building);

    building.setTeam(entity.teamID);
    building.onTeamUpdate(gameContext, nextTeam);
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