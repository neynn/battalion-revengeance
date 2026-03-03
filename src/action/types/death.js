import { Action } from "../../../engine/action/action.js";
import { DEATH_FADE_RATE } from "../../constants.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";
import { SOUND_TYPE } from "../../enums.js";
import { playEntitySound } from "../../systems/sound.js";
import { playDeathEffect } from "../../systems/sprite.js";

export const DeathAction = function(despawn) {
    Action.call(this);

    this.opacity = 1;
    this.entities = [];
    this._despawn = despawn;
}

DeathAction.prototype = Object.create(Action.prototype);
DeathAction.prototype.constructor = DeathAction;

DeathAction.prototype.onStart = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entities } = data;

    for(let i = 0; i < entities.length; i++) {
        const entity = entityManager.getEntity(entities[i]);

        entity.setOpacity(1);
        entity.setState(BattalionEntity.STATE.DEAD);

        playDeathEffect(gameContext, entity);
        playEntitySound(gameContext, entity, SOUND_TYPE.DEATH);

        this.entities.push(entity);
    }
}

DeathAction.prototype.onUpdate = function(gameContext, data) {
    const { timer } = gameContext;
    const fixedDeltaTime = timer.getFixedDeltaTime();

    this.opacity -= DEATH_FADE_RATE * fixedDeltaTime;

    if(this.opacity < 0) {
        this.opacity = 0;
    }

    for(let i = 0; i < this.entities.length; i++) {
        this.entities[i].setOpacity(this.opacity);
    }
}

DeathAction.prototype.isFinished = function(gameContext, executionPlan) {
    return this.opacity <= 0;
}

DeathAction.prototype.onEnd = function(gameContext, data) {
    this.execute(gameContext, data);
    this.opacity = 1;
    this.entities.length = 0;
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