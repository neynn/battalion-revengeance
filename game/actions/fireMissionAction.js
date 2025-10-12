import { Action } from "../../engine/action/action.js";
import { ActionRequest } from "../../engine/action/actionRequest.js";
import { ACTION_TYPE } from "../enums.js";
import { FireMissionSystem } from "../systems/fireMission.js";

export const FireMissionAction = function() {
    Action.call(this);
}

FireMissionAction.prototype = Object.create(Action.prototype);
FireMissionAction.prototype.constructor = FireMissionAction;

FireMissionAction.prototype.onStart = function(gameContext, request) {
    const { callID, tileX, tileY, targets } = request;

    FireMissionSystem.startFireMission(gameContext, callID, tileX, tileY, targets);
}

FireMissionAction.prototype.onEnd = function(gameContext, request) {
    const { actorID, callID, tileX, tileY, targets } = request;

    FireMissionSystem.endFireMission(gameContext, callID, actorID, tileX, tileY, targets);
}

FireMissionAction.prototype.isFinished = function(gameContext, request) {
    const timeRequired = gameContext.settings.hitDuration;

    //Fire missions have no animation as of yet, so return true immediately.
    return true || request.timePassed >= timeRequired;
}

FireMissionAction.prototype.validate = function(gameContext, request) {
    const { actorID, callID, tileX, tileY } = request;
    const fireMission = gameContext.getFireMissionType(callID);

    if(!fireMission) {
        return null;
    }

    const isBlocked = FireMissionSystem.isBlocked(gameContext, fireMission, tileX, tileY);

    if(isBlocked) {
        return null;
    }

    const targets = FireMissionSystem.getTargets(gameContext, fireMission, tileX, tileY);

    return {
        "actorID": actorID,
        "callID": callID,
        "tileX": tileX,
        "tileY": tileY,
        "targets": targets
    }
}

FireMissionAction.createRequest = function(actorID, callID, tileX, tileY) {
    const request = new ActionRequest(ACTION_TYPE.FIRE_MISSION, {
        "actorID": actorID,
        "callID": callID,
        "tileX": tileX,
        "tileY": tileY
    });

    return request;
}