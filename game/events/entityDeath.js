import { AnimationSystem } from "../systems/animation.js";
import { SpawnSystem } from "../systems/spawn.js";
import { ArmyEvent } from "./armyEvent.js";

export const EntityDeathEvent = function() {}

EntityDeathEvent.prototype = Object.create(ArmyEvent.prototype);
EntityDeathEvent.prototype.constructor = EntityDeathEvent;

EntityDeathEvent.prototype.onStory = function(gameContext, event) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, reason } = event;
    const entity = entityManager.getEntity(entityID);

    if(entity) {
        AnimationSystem.playDeath(gameContext, entity);
        SpawnSystem.destroyEntity(gameContext, entity);
    }
}

EntityDeathEvent.createEvent = function(entityID, reason) {
    return {
        "entityID": entityID,
        "reason": reason
    }
}