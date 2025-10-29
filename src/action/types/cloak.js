import { Action } from "../../../engine/action/action.js";

export const CloakAction = function() {
    Action.call(this);

    this.opacity = 1;
    this.entity = null;
}

CloakAction.FADE_RATE = 3;

CloakAction.prototype = Object.create(Action.prototype);
CloakAction.prototype.constructor = CloakAction;

CloakAction.prototype.onStart = function(gameContext, data, id) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID  } = data;
    const entity = entityManager.getEntity(entityID);

    entity.playCloak(gameContext);

    this.entity = entity;
}

CloakAction.prototype.onUpdate = function(gameContext, data, id) {
    const { timer } = gameContext;
    const fixedDeltaTime = timer.getFixedDeltaTime();

    this.opacity -= CloakAction.FADE_RATE * fixedDeltaTime;

    if(this.opacity < 0) {
        this.opacity = 0;
    }

    this.entity.setOpacity(this.opacity);
}

CloakAction.prototype.isFinished = function(gameContext, executionRequest) {
    return this.opacity <= 0;
}

CloakAction.prototype.onEnd = function(gameContext, data, id) {
    this.entity = null;
    this.opacity = 1;
}

CloakAction.prototype.validate = function(gameContext, executionRequest, requestData) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID } = requestData;
    const entity = entityManager.getEntity(entityID);

    if(entity && entity.canCloakAtSelf(gameContext)) {
        executionRequest.setData({
            "entityID": entityID
        });
    }
}