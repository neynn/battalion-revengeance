import { ArmyEventHandler } from "../armyEventHandler.js";
import { ArmyEvent } from "./armyEvent.js";
import { EntityDeathEvent } from "./entityDeath.js";

export const EntityDecayEvent = function() {}

EntityDecayEvent.prototype = Object.create(ArmyEvent.prototype);
EntityDecayEvent.prototype.constructor = EntityDecayEvent;

EntityDecayEvent.prototype.onStory = function(gameContext, event) {
    const { world } = gameContext;
    const { eventBus } = world;
    const { entityID } = event;

    eventBus.emit(ArmyEventHandler.TYPE.ENTITY_DEATH, EntityDeathEvent.createEvent(entityID, ArmyEventHandler.KILL_REASON.DECAY));
}

EntityDecayEvent.createEvent = function(entityID) {
    return {
        "entityID": entityID
    }
}