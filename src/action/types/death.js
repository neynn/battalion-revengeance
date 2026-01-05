import { Action } from "../../../engine/action/action.js";
import { despawnEntity } from "../../systems/spawn.js";

export const DeathAction = function() {
    Action.call(this);

    this.priority = Action.PRIORITY.HIGH;
    this.opacity = 1;
    this.entities = [];
}

DeathAction.FADE_RATE = 1.5;

DeathAction.prototype = Object.create(Action.prototype);
DeathAction.prototype.constructor = DeathAction;

DeathAction.prototype.onStart = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entities } = data;

    for(let i = 0; i < entities.length; i++) {
        const entity = entityManager.getEntity(entities[i]);

        entity.setOpacity(1);
        entity.playDeath(gameContext);

        this.entities.push(entity);
    }
}

DeathAction.prototype.onUpdate = function(gameContext, data) {
    const { timer } = gameContext;
    const fixedDeltaTime = timer.getFixedDeltaTime();

    this.opacity -= DeathAction.FADE_RATE * fixedDeltaTime;

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
        despawnEntity(gameContext, entity);
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