import { Action } from "../../engine/action/action.js";
import { ActionRequest } from "../../engine/action/actionRequest.js";
import { ACTION_TYPE } from "../enums.js";
import { AnimationSystem } from "../systems/animation.js";
import { DebrisSystem } from "../systems/debris.js";

export const ClearDebrisAction = function() {
    Action.call(this);
}

ClearDebrisAction.prototype = Object.create(Action.prototype);
ClearDebrisAction.prototype.constructor = ClearDebrisAction;

ClearDebrisAction.prototype.onStart = function(gameContext, actionData, actionID) {
    const { tileX, tileY, actorID } = actionData;

    AnimationSystem.playCleaning(gameContext, tileX, tileY);
}

ClearDebrisAction.prototype.onEnd = function(gameContext, actionData, actionID) {
    const { tileX, tileY, actorID } = actionData;

    DebrisSystem.endCleaning(gameContext, tileX, tileY, actorID);
}

ClearDebrisAction.prototype.isFinished = function(gameContext, request) {
    const timeRequired = gameContext.settings.iconDuration;

    return request.timePassed >= timeRequired;
}

ClearDebrisAction.prototype.getValidated = function(gameContext, request) {
    const { tileX, tileY, actorID } = request;
    const isCleanable = DebrisSystem.isCleanable(gameContext, tileX, tileY, actorID)

    if(!isCleanable) {
        return null;
    }

    return {
        "tileX": tileX,
        "tileY": tileY,
        "actorID": actorID
    }
}

ClearDebrisAction.createRequest = function(actorID, tileX, tileY) {
    const request = new ActionRequest(ACTION_TYPE.CLEAR_DEBRIS, {
        "actorID": actorID,
        "tileX": tileX,
        "tileY": tileY
    });

    return request;
}