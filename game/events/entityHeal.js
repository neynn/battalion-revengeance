import { ArmyEvent } from "./armyEvent.js";

export const EntityHealEvent = function() {}

EntityHealEvent.prototype = Object.create(ArmyEvent.prototype);
EntityHealEvent.prototype.constructor = EntityHealEvent;

EntityHealEvent.createEvent = function(entityID, health) {
    return {
        "entityID": entityID,
        "health": health
    }
}