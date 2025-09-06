import { DropSystem } from "../systems/drop.js";
import { SpawnSystem } from "../systems/spawn.js";
import { ArmyEvent } from "./armyEvent.js";

export const EntitySellEvent = function() {}

EntitySellEvent.prototype = Object.create(ArmyEvent.prototype);
EntitySellEvent.prototype.constructor = EntitySellEvent;

EntitySellEvent.prototype.onStory = function(gameContext, event) {
    const { world } = gameContext;
    const { entityManager } = world;

    const { entityID, actorID } = event;
    const entity = entityManager.getEntity(entityID);

    if(entity) {
        DropSystem.createEntityDrop(gameContext, entity, DropSystem.DROP_TYPE.SELL, actorID);
        SpawnSystem.destroyEntity(gameContext, entity);
    }
}

EntitySellEvent.createEvent = function(entityID, actorID) {
    return {
        "entityID": entityID,
        "actorID": actorID
    }
}