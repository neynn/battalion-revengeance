import { Action } from "../../../engine/action/action.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";
import { COMMAND_TYPE } from "../../enums.js";
import { playAttackEffect } from "../../systems/animation.js";
import { ActionHelper } from "../actionHelper.js";
import { InteractionResolver } from "./interactionResolver.js";

const resolveHeal = function(gameContext, entity, target, resolver) {
    if(entity.isHealValid(gameContext, target) && entity.isHealPositionValid(gameContext, target)) {
        entity.mResolveHeal(gameContext, target, resolver);
    }
}

export const HealAction = function() {
    Action.call(this);
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

    //TODO: Makes no sense.
    playAttackEffect(gameContext, entity, target, resolutions);

    this.entity = entity;
    this.resolutions = resolutions;
}

HealAction.prototype.isFinished = function(gameContext, executionPlan) {
    return this.entity.isAnimationFinished();
}

HealAction.prototype.onEnd = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager } = world;

    for(let i = 0; i < this.resolutions.length; i++) {
        const { entityID, health } = this.resolutions[i];
        const targetObject = entityManager.getEntity(entityID);

        targetObject.setHealth(health);
    }

    this.entity.playIdle(gameContext);
    this.entity.onHealEnd();
    this.entity = null;
    this.resolutions = [];
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
        case COMMAND_TYPE.CHAIN_AFTER_MOVE: {
            if(entity.hasFlag(BattalionEntity.FLAG.HAS_MOVED) && !entity.hasFlag(BattalionEntity.FLAG.HAS_FIRED) && entity.isNextToEntity(target)) {
                resolveHeal(gameContext, entity, target, resolver);
            }

            break;
        }
        case COMMAND_TYPE.INITIATE: {
            if(!entity.hasFlag(BattalionEntity.FLAG.HAS_FIRED | BattalionEntity.FLAG.HAS_MOVED)) {
               resolveHeal(gameContext, entity, target, resolver);
            }
    
            break;
        }
    }

    const hitEntities = resolver.getHitEntities();
    const deadEntities = resolver.getDeadEntities();

     if(hitEntities.length !== 0) {
        if(deadEntities.length !== 0) {
            executionPlan.addNext(ActionHelper.createDeathRequest(gameContext, deadEntities));
        }

        executionPlan.setData({
            "entityID": entityID,
            "targetID": targetID,
            "resolutions": hitEntities
        });
    }
}