import { OBJECTIVE_TYPE } from "../enums.js";
import { DropSystem } from "../systems/drop.js";
import { ArmyEvent } from "./armyEvent.js";

export const EntityCollectEvent = function() {}

EntityCollectEvent.prototype = Object.create(ArmyEvent.prototype);
EntityCollectEvent.prototype.constructor = EntityCollectEvent;

EntityCollectEvent.prototype.onStory = function(gameContext, event) {
    const { world } = gameContext;
    const { turnManager, entityManager } = world;
    const { actorID, entityID } = event;
    const actor = turnManager.getActor(actorID);
    const entity = entityManager.getEntity(entityID);

    if(entity) {
        if(actor && actor.missions) {
            actor.missions.onObjective(OBJECTIVE_TYPE.COLLECT, entity.config.archetype, 1);
        }

        DropSystem.createProductionDrop(gameContext, entity, actorID);
    }
}

EntityCollectEvent.createEvent = function(actorID, entityID) {
    return {
        "actorID": actorID,
        "entityID": entityID
    }
}