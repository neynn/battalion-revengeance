import { Action } from "../../../engine/action/action.js";
import { FADE_RATE } from "../../constants.js";
import { TRAIT_TYPE } from "../../enums.js";
import { playUncloakSound } from "../../systems/sound.js";
import { createTrackingIntent } from "../actionHelper.js";

export const UncloakAction = function() {
    Action.call(this);

    this.opacity = 0;
    this.entities = [];
}

UncloakAction.prototype = Object.create(Action.prototype);
UncloakAction.prototype.constructor = UncloakAction;

UncloakAction.prototype.onStart = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entities } = data;

    playUncloakSound(gameContext);

    for(let i = 0; i < entities.length; i++) {
        const entity = entityManager.getEntity(entities[i]);

        this.entities.push(entity);
    }
}

UncloakAction.prototype.onUpdate = function(gameContext, data) {
    const { timer } = gameContext;
    const fixedDeltaTime = timer.getFixedDeltaTime();

    this.opacity += FADE_RATE * fixedDeltaTime;

    if(this.opacity > 1) {
        this.opacity = 1;
    }

    for(const entity of this.entities) {
        entity.setOpacity(this.opacity);
    }
}

UncloakAction.prototype.isFinished = function(gameContext, executionPlan) {
    return this.opacity >= 1;
}

UncloakAction.prototype.onEnd = function(gameContext, data) {
    this.execute(gameContext, data);

    for(const entity of this.entities) {
        entity.setOpacity(1);
    }

    this.entities.length = 0;
    this.opacity = 0;
}

UncloakAction.prototype.execute = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entities } = data;

    for(let i = 0; i < entities.length; i++) {
        const entity = entityManager.getEntity(entities[i]);

        entity.setUncloaked();
    }
}

UncloakAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID } = actionIntent;
    const entity = entityManager.getEntity(entityID);

    if(!entity || entity.isDead()) {
        return;
    }

    const uncloakedEntities = entity.getUncloakedEntitiesAtSelf(gameContext);

    if(uncloakedEntities.length === 0) {
        return;
    }

    if(entity.hasTrait(TRAIT_TYPE.TRACKING)) {
        executionPlan.addNext(createTrackingIntent(entity, uncloakedEntities));
    }

    const ids = uncloakedEntities.map(e => e.getID());
    
    if(uncloakedEntities.length !== 0) {
        executionPlan.setData({
            "entities": ids
        });
    }
}