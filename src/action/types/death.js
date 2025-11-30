import { Action } from "../../../engine/action/action.js";
import { EntitySpawner } from "../../entity/entitySpawner.js";

export const DeathAction = function() {
    Action.call(this);

    this.priority = Action.PRIORITY.HIGH;
    this.opacity = 1;
    this.entities = [];
}

DeathAction.FADE_RATE = 1.5;

DeathAction.prototype = Object.create(Action.prototype);
DeathAction.prototype.constructor = DeathAction;

DeathAction.prototype.onStart = function(gameContext, data, id) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entities } = data;

    for(let i = 0; i < entities.length; i++) {
        const entity = entityManager.getEntity(entities[i]);

        entity.playDeath(gameContext);
        entity.onDeath(gameContext);
        entity.setHealth(0);

        this.entities.push(entity);
    }
}

DeathAction.prototype.onUpdate = function(gameContext, data, id) {
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

DeathAction.prototype.isFinished = function(gameContext, executionRequest) {
    return this.opacity <= 0;
}

DeathAction.prototype.onEnd = function(gameContext, data, id) {
    const { teamManager } = gameContext;

    for(let i = 0; i < this.entities.length; i++) {
        const entity = this.entities[i];

        EntitySpawner.removeEntity(gameContext, entity);
        teamManager.broadcastEntityDeath(gameContext, entity);
        entity.destroy();
    }

    this.opacity = 1;
    this.entities.length = 0;
}

DeathAction.prototype.validate = function(gameContext, executionRequest, requestData) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entities } = requestData;
    const deadEntities = [];

    for(let i = 0; i < entities.length; i++) {
        const entity = entityManager.getEntity(entities[i]);

        if(entity) {
            deadEntities.push(entities[i]);
        }
    }

    if(deadEntities.length !== 0) {
        executionRequest.setData({
            "entities": deadEntities
        });
    }
}