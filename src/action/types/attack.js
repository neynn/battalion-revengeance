import { Action } from "../../../engine/action/action.js";
import { TypeRegistry } from "../../type/typeRegistry.js";
import { ActionHelper } from "../actionHelper.js";

export const AttackAction = function() {
    Action.call(this);

    this.entity = null;
    this.resolutions = [];
}

AttackAction.ATTACK_TYPE = {
    INITIATE: 0,
    COUNTER: 1
};

AttackAction.prototype = Object.create(Action.prototype);
AttackAction.prototype.constructor = AttackAction;

AttackAction.prototype.createWeaponSprite = function(gameContext, entity, target) {
    const { spriteManager, transform2D } = gameContext;
    const attackEffect = entity.getAttackSprite();
    const sprite = spriteManager.createSprite(attackEffect, TypeRegistry.LAYER_TYPE.GFX);

    if(sprite) {
        const { tileX, tileY } = target;
        const { x, y } = transform2D.transformTileToWorld(tileX, tileY);

        sprite.setPosition(x, y);
        sprite.expire();
    }
}

AttackAction.prototype.onStart = function(gameContext, data, id) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, targetID, resolutions, uncloak, attackType } = data;
    const entity = entityManager.getEntity(entityID);
    const target = entityManager.getEntity(targetID);

    entity.lookAt(target);

    switch(attackType) {
        case AttackAction.ATTACK_TYPE.INITIATE: {
            entity.playAttack(gameContext);
            break;
        }
        case AttackAction.ATTACK_TYPE.COUNTER: {
            entity.playCounter(gameContext);
            break;
        }
    }

    this.entity = entity;
    this.resolutions = resolutions;
    this.createWeaponSprite(gameContext, entity, target);

    if(uncloak) {
        entity.uncloakInstant();
    }
}

AttackAction.prototype.onUpdate = function(gameContext, data, id) {}

AttackAction.prototype.isFinished = function(gameContext, executionRequest) {
    return this.entity.isAnimationFinished();
}

AttackAction.prototype.onEnd = function(gameContext, data, id) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { attackType } = data;

    for(let i = 0; i < this.resolutions.length; i++) {
        const { entityID, health } = this.resolutions[i];
        const targetObject = entityManager.getEntity(entityID);

        targetObject.setHealth(health);
    }

    this.entity.playIdle(gameContext);

    if(attackType === AttackAction.ATTACK_TYPE.INITIATE) {
        this.entity.reduceMove();
    }

    this.entity = null;
    this.resolutions = [];
}

AttackAction.prototype.mGetCounterResolutions = function(gameContext, entity, target, resolutions) {
    const { minRange } = entity;
    const maxRange = entity.getMaxRange(gameContext);
    const distance = entity.getDistanceToEntity(target)

    if(!entity.isDead() && !target.isDead()) {
        if(distance >= minRange && distance <= maxRange) {
            const damage = entity.getDamage(gameContext, target, AttackAction.ATTACK_TYPE.COUNTER);
            const remainingHealth = target.getHealthAfter(damage);

            resolutions.push({
                "entityID": target.getID(),
                "health": remainingHealth
            });
        }
    }
}

AttackAction.prototype.mGetInitiateResolutions = function(gameContext, entity, target, resolutions) {
    const { minRange } = entity;
    const maxRange = entity.getMaxRange(gameContext);
    const distance = entity.getDistanceToEntity(target)

    if(!entity.isDead() && !target.isDead()) {
        if(distance >= minRange && distance <= maxRange) {
            const damage = entity.getDamage(gameContext, target, AttackAction.ATTACK_TYPE.INITIATE);
            const remainingHealth = target.getHealthAfter(damage);

            resolutions.push({
                "entityID": target.getID(),
                "health": remainingHealth
            });

            if(entity.hasTrait(TypeRegistry.TRAIT_TYPE.SELF_DESTRUCT)) {
                resolutions.push({
                    "entityID": entity.getID(),
                    "health": 0
                });
            }
        }
    }
}

AttackAction.prototype.validate = function(gameContext, executionRequest, requestData) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, targetID, attackType } = requestData;
    const entity = entityManager.getEntity(entityID);
    const target = entityManager.getEntity(targetID);

    if(!entity || !target) {
        return;
    }

    let uncloak = false;
    const resolutions = [];

    switch(attackType) {
        case AttackAction.ATTACK_TYPE.INITIATE: {
            if(entity.hasMoveLeft()) {
                this.mGetInitiateResolutions(gameContext, entity, target, resolutions);

                if(resolutions.length !== 0) {
                    if(entity.isCloaked) {
                        uncloak = true;
                    }

                    //TODO: Check if target can counter -> add counter attack as next.
                    const counterAttack = ActionHelper.createAttackRequest(targetID, entityID, AttackAction.ATTACK_TYPE.COUNTER);

                    executionRequest.addNext(counterAttack);
                }
            }

            break;
        }
        case AttackAction.ATTACK_TYPE.COUNTER: {
            this.mGetCounterResolutions(gameContext, entity, target, resolutions);
            break;
        }
    }

    if(resolutions.length > 0) {
        const deadEntities = [];

        for(let i = 0; i < resolutions.length; i++) {
            const { entityID, health } = resolutions[i];

            if(health <= 0) {
                deadEntities.push(entityID);
            }
        }

        if(deadEntities.length > 0) {
            const deathRequest = ActionHelper.createDeathRequest(gameContext, deadEntities);

            executionRequest.addNext(deathRequest);
        }

        executionRequest.setData({
            "entityID": entityID,
            "targetID": targetID,
            "resolutions": resolutions,
            "attackType": attackType,
            "uncloak": uncloak
        });
    }
}