import { Action } from "../../../engine/action/action.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";
import { SOUND_TYPE } from "../../enums.js";
import { playEntitySound } from "../../systems/sound.js";
import { playDeathEffect } from "../../systems/sprite.js";
import { DeathTween } from "../../tween/types/deathTween.js";

export const DeathAction = function(despawn) {
    Action.call(this);

    this._despawn = despawn;
}

DeathAction.prototype = Object.create(Action.prototype);
DeathAction.prototype.constructor = DeathAction;

DeathAction.prototype.onStart = function(gameContext, data) {
    const { world, tweenManager } = gameContext;
    const { entityManager } = world;
    const { entities } = data;
    const entityList = [];

    for(let i = 0; i < entities.length; i++) {
        const entity = entityManager.getEntity(entities[i]);

        entity.setOpacity(1);
        entity.setState(BattalionEntity.STATE.DEAD);

        playDeathEffect(gameContext, entity);
        playEntitySound(gameContext, entity, SOUND_TYPE.DEATH);

        entityList.push(entity);
    }

    tweenManager.addTween(new DeathTween(entityList));
}

DeathAction.prototype.isFinished = function(gameContext, executionPlan) {
    const { tweenManager } = gameContext;

    return tweenManager.isEmpty();
}

DeathAction.prototype.onEnd = function(gameContext, data) {
    this.execute(gameContext, data);
}

DeathAction.prototype.execute = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entities } = data;

    for(let i = 0; i < entities.length; i++) {
        const entity = entityManager.getEntity(entities[i]);

        entity.setHealth(0);

        this._despawn(gameContext, entity);
    }
}

DeathAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entities } = actionIntent;
    const deadEntities = [];

    for(let i = 0; i < entities.length; i++) {
        const entity = entityManager.getEntity(entities[i]);

        if(entity) {
            deadEntities.push(entities[i]);
        }
    }

    if(deadEntities.length !== 0) {
        executionPlan.setData({
            "entities": deadEntities
        });
    }
}