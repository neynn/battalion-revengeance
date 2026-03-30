import { Action } from "../../../engine/action/action.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";
import { SOUND_TYPE } from "../../enums.js";
import { playEntitySound } from "../../systems/sound.js";
import { getAnimationDuration, playHealEffect, updateEntitySprite } from "../../systems/sprite.js";
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
    entity.setState(BattalionEntity.STATE.FIRE);

    updateEntitySprite(gameContext, entity);
    playEntitySound(gameContext, entity, SOUND_TYPE.HEAL);
    playHealEffect(gameContext, entity, target);

    this.duration = getAnimationDuration(gameContext, entity);
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

    entity.setState(BattalionEntity.STATE.IDLE);
    updateEntitySprite(gameContext, entity);

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

    entity.setActed();
}

HealAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, targetID } = actionIntent;
    const entity = entityManager.getEntity(entityID);
    const target = entityManager.getEntity(targetID);

    if(!entity || !target) {
        return;
    }

    const resolver = new InteractionResolver();

    if(entity.canActAndMove()) {
        resolveHeal(gameContext, entity, target, resolver);
    } else {
        //Melee healers.
        if(entity.hasFlag(BattalionEntity.FLAG.HAS_MOVED) && entity.hasFlag(BattalionEntity.FLAG.CAN_ACT) && entity.isNextToEntity(target)) {
            resolveHeal(gameContext, entity, target, resolver);
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