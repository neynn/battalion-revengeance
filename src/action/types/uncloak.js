import { Action } from "../../../engine/action/action.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";

export const UncloakAction = function() {
    Action.call(this);

    this.opacity = 0;
    this.entity = null;
}

UncloakAction.FADE_RATE = 3;

UncloakAction.prototype = Object.create(Action.prototype);
UncloakAction.prototype.constructor = UncloakAction;

UncloakAction.prototype.onStart = function(gameContext, data, id) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID  } = data;
    const entity = entityManager.getEntity(entityID);

    entity.playSound(gameContext, BattalionEntity.SOUND_TYPE.CLOAK);

    this.entity = entity;
}

UncloakAction.prototype.onUpdate = function(gameContext, data, id) {
    const { timer } = gameContext;
    const fixedDeltaTime = timer.getFixedDeltaTime();

    this.opacity += UncloakAction.FADE_RATE * fixedDeltaTime;

    if(this.opacity > 1) {
        this.opacity = 1;
    }

    this.entity.setOpacity(this.opacity);
}

UncloakAction.prototype.isFinished = function(gameContext, executionRequest) {
    return this.opacity >= 1;
}

UncloakAction.prototype.onEnd = function(gameContext, data, id) {
    this.entity.uncloakInstant();
    this.entity = null;
    this.opacity = 0;
}

UncloakAction.prototype.validate = function(gameContext, executionRequest, requestData) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID } = requestData;
    const entity = entityManager.getEntity(entityID);

    if(entity && entity.canUncloak()) {
        executionRequest.setData({
            "entityID": entityID
        });
    }
}