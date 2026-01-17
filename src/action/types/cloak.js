import { Action } from "../../../engine/action/action.js";
import { FADE_RATE } from "../../constants.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";

export const CloakAction = function() {
    Action.call(this);

    this.opacity = 1;
    this.entity = null;
}

CloakAction.prototype = Object.create(Action.prototype);
CloakAction.prototype.constructor = CloakAction;

CloakAction.prototype.onStart = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID  } = data;
    const entity = entityManager.getEntity(entityID);

    entity.playCloak(gameContext);

    this.entity = entity;
}

CloakAction.prototype.onUpdate = function(gameContext, data) {
    const { timer } = gameContext;
    const fixedDeltaTime = timer.getFixedDeltaTime();

    this.opacity -= FADE_RATE * fixedDeltaTime;

    if(this.opacity < 0) {
        this.opacity = 0;
    }

    this.entity.setOpacity(this.opacity);
}

CloakAction.prototype.isFinished = function(gameContext, executionPlan) {
    return this.opacity <= 0;
}

CloakAction.prototype.onEnd = function(gameContext, data) {
    this.execute(gameContext, data);
    this.entity = null;
    this.opacity = 1;
}

CloakAction.prototype.execute = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID  } = data;
    const entity = entityManager.getEntity(entityID);

    entity.setFlag(BattalionEntity.FLAG.IS_CLOAKED);
}

CloakAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID } = actionIntent;
    const entity = entityManager.getEntity(entityID);

    if(entity && entity.canCloakAtSelf(gameContext)) {
        executionPlan.setData({
            "entityID": entityID
        });
    }
}