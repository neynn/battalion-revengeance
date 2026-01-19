import { Action } from "../../../engine/action/action.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";
import { COMMAND_TYPE } from "../../enums.js";
import { playHealEffect } from "../../systems/animation.js";
import { createDeathIntent } from "../actionHelper.js";
import { InteractionResolver } from "../interactionResolver.js";

const resolveHeal = function(gameContext, entity, target, resolver) {
    if(entity.isHealValid(gameContext, target) && entity.isHealPositionValid(gameContext, target)) {
        entity.mResolveHeal(gameContext, target, resolver);
    }
}

export const HealAction = function() {
    Action.call(this);

    this.duration = 0;
    this.passedTime = 0;
}

HealAction.prototype = Object.create(Action.prototype);
HealAction.prototype.constructor = HealAction;

HealAction.prototype.onStart = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, targetID, resolutions } = data;
    const entity = entityManager.getEntity(entityID);
    const target = entityManager.getEntity(targetID);

    entity.lookAt(target);
    entity.playHeal(gameContext, target);

    playHealEffect(gameContext, entity, target);

    this.duration = entity.getAnimationDuration();
}

HealAction.prototype.onUpdate = function(gameContext, data) {
    const { timer } = gameContext;
    const deltaTime = timer.getFixedDeltaTime();

    this.passedTime += deltaTime;
}
 
HealAction.prototype.isFinished = function(gameContext, executionPlan) {
    return this.passedTime >= this.duration;
}

HealAction.prototype.onEnd = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID } = data;
    const entity = entityManager.getEntity(entityID);

    entity.playIdle(gameContext);

    this.execute(gameContext, data);
    this.duration = 0;
    this.passedTime = 0;
}

HealAction.prototype.execute = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, resolutions } = data;
    const entity = entityManager.getEntity(entityID);

    for(let i = 0; i < resolutions.length; i++) {
        const { entityID, health } = resolutions[i];
        const targetObject = entityManager.getEntity(entityID);

        targetObject.setHealth(health);
    }

    entity.setFlag(BattalionEntity.FLAG.HAS_FIRED);
}

HealAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, targetID, command } = actionIntent;
    const entity = entityManager.getEntity(entityID);
    const target = entityManager.getEntity(targetID);

    if(!entity || !target) {
        return;
    }

    const resolver = new InteractionResolver();

    switch(command) {
        case COMMAND_TYPE.ATTACK: {
            if(entity.canAct()) {
               resolveHeal(gameContext, entity, target, resolver);
            } else {
                if(entity.hasFlag(BattalionEntity.FLAG.HAS_MOVED) && !entity.hasFlag(BattalionEntity.FLAG.HAS_FIRED) && entity.isNextToEntity(target)) {
                    resolveHeal(gameContext, entity, target, resolver);
                } 
            }

            break;
        }
    }

    const hitEntities = resolver.getHitEntities();
    const deadEntities = resolver.getDeadEntities();

     if(hitEntities.length !== 0) {
        if(deadEntities.length !== 0) {
            executionPlan.addNext(createDeathIntent(deadEntities));
        }

        executionPlan.setData({
            "entityID": entityID,
            "targetID": targetID,
            "resolutions": hitEntities
        });
    }
}