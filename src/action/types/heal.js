import { Action } from "../../../engine/action/action.js";
import { ActionIntent } from "../../../engine/action/actionIntent.js";
import { FIXED_DELTA_TIME } from "../../../engine/engine_constants.js";
import { EntityManager } from "../../../engine/entity/entityManager.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";
import { ACTION_TYPE, SOUND_TYPE, TRAIT_TYPE } from "../../enums.js";
import { playEntitySound } from "../../systems/sound.js";
import { getAnimationDuration, playHealEffect, updateEntitySprite } from "../../systems/sprite.js";
import { getDeadEntities, InteractionResolver } from "../interactionResolver.js";
import { DeathActionVTable } from "./death.js";

const resolveHeal = function(gameContext, entity, target, resolver) {
    if(entity.isHealValid(gameContext, target) && entity.isHealPositionValid(gameContext, target)) {
        entity.mResolveHeal(gameContext, target, resolver);
    }
}

const createHealIntent = function(entityID, targetID) {
    return new ActionIntent(ACTION_TYPE.HEAL, {
        "entityID": entityID,
        "targetID": targetID
    });
}

const createHealData = function() {
    return {
        "entityID": EntityManager.INVALID_ID,
        "targetID": EntityManager.INVALID_ID,
        "resolutions": []
    }
}

const fillHealPlan = function(gameContext, executionPlan, actionIntent) {
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

    const resolutions = resolver.createResolutions(gameContext);

     if(resolutions.length !== 0) {
        const deadEntities = getDeadEntities(resolutions);

        if(deadEntities.length !== 0) {
            executionPlan.addNext(DeathActionVTable.createIntent(deadEntities));
        }

        const data = createHealData();

        data.entityID = entityID;
        data.targetID = targetID;
        data.resolutions = resolutions;

        executionPlan.setData(data);
    }
}

const executeHeal = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, targetID, resolutions } = data;
    const entity = entityManager.getEntity(entityID);
    const doInflaming = entity.hasTrait(TRAIT_TYPE.INFLAMING);

    for(let i = 0; i < resolutions.length; i++) {
        const { entityID, health } = resolutions[i];
        const targetObject = entityManager.getEntity(entityID);

        targetObject.setHealth(health);

        //MAYBE(neyn): If an entity modifies itself with healing, then inflaming is applied
        //Healers with ABSORBER would be one option.
        if(doInflaming) {
            targetObject.applyInflaming();
        }
    }

    entity.setActed();
}

export const HealVTable = {
    createIntent: createHealIntent,
    createData: createHealData,
    fillPlan: fillHealPlan,
    execute: executeHeal
};

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
    this.passedTime += FIXED_DELTA_TIME;
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

    this.duration = 0;
    this.passedTime = 0;
}