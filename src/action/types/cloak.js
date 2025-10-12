import { Action } from "../../../engine/action/action.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";

export const CloakAction = function() {
    Action.call(this);

    this.entity = null;
    this.opacity = 1;
    this.cloakRate = 3;
}

CloakAction.prototype = Object.create(Action.prototype);
CloakAction.prototype.constructor = CloakAction;

CloakAction.prototype.onStart = function(gameContext, data, id) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID  } = data;
    const entity = entityManager.getEntity(entityID);

    entity.cloak();
    entity.playSound(gameContext, BattalionEntity.SOUND_TYPE.CLOAK);

    this.entity = entity;
}

CloakAction.prototype.onUpdate = function(gameContext, data, id) {
    const { timer } = gameContext;
    const fixedDeltaTime = timer.getFixedDeltaTime();

    this.opacity -= this.cloakRate * fixedDeltaTime;

    if(this.opacity < 0) {
        this.opacity = 0;
    }

    this.entity.setOpacity(this.opacity);
}

CloakAction.prototype.isFinished = function(gameContext, executionRequest) {
    return this.opacity === 0;
}

CloakAction.prototype.onEnd = function(gameContext, data, id) {
    this.entity = null;
    this.opacity = 1;
}

CloakAction.prototype.getValidated = function(gameContext, requestData) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID } = requestData;
    const entity = entityManager.getEntity(entityID);

    if(entity && entity.canCloak()) {
        return {
            "entityID": entityID
        }
    }


    return null;
}