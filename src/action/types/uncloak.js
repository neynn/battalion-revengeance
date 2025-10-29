import { Action } from "../../../engine/action/action.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";

export const UncloakAction = function() {
    Action.call(this);

    this.opacity = 0;
    this.entities = [];
}

UncloakAction.FADE_RATE = 3;

UncloakAction.prototype = Object.create(Action.prototype);
UncloakAction.prototype.constructor = UncloakAction;

UncloakAction.prototype.onStart = function(gameContext, data, id) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entities } = data;

    for(let i = 0; i < entities.length; i++) {
        const entity = entityManager.getEntity(entities[i]);

        entity.playSound(gameContext, BattalionEntity.SOUND_TYPE.CLOAK);

        this.entities.push(entity);
    }
}

UncloakAction.prototype.onUpdate = function(gameContext, data, id) {
    const { timer } = gameContext;
    const fixedDeltaTime = timer.getFixedDeltaTime();

    this.opacity += UncloakAction.FADE_RATE * fixedDeltaTime;

    if(this.opacity > 1) {
        this.opacity = 1;
    }

    for(const entity of this.entities) {
        entity.setOpacity(this.opacity);
    }
}

UncloakAction.prototype.isFinished = function(gameContext, executionRequest) {
    return this.opacity >= 1;
}

UncloakAction.prototype.onEnd = function(gameContext, data, id) {
    for(const entity of this.entities) {
        entity.uncloakInstant();
    }

    this.entities.length = 0;
    this.opacity = 0;
}

UncloakAction.prototype.validate = function(gameContext, executionRequest, requestData) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entities } = requestData;
    const uncloakedEntities = [];

    for(let i = 0; i < entities.length; i++) {
        const entityID = entities[i];
        const entity = entityManager.getEntity(entityID);

        if(entity && entity.canUncloak()) {
            uncloakedEntities.push(entityID);
        }
    }

    if(uncloakedEntities.length !== 0) {
        executionRequest.setData({
            "entities": uncloakedEntities
        });
    }
}