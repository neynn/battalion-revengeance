import { DropSystem } from "../systems/drop.js";
import { ArmyEvent } from "./armyEvent.js";

export const EntityHitEvent = function() {}

EntityHitEvent.prototype = Object.create(ArmyEvent.prototype);
EntityHitEvent.prototype.constructor = EntityHitEvent;

EntityHitEvent.prototype.onStory = function(gameContext, event) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, actorID } = event;
    const entity = entityManager.getEntity(entityID);

    if(entity) {
        DropSystem.createEntityDrop(gameContext, entity, DropSystem.DROP_TYPE.HIT, actorID);
    }
}

EntityHitEvent.createEvent = function(entityID, actorID, damage, reason) {
    return {
        "entityID": entityID,
        "actorID": actorID,
        "damage": damage,
        "reason": reason
    }
}