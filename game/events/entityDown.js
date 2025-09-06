import { ArmyEvent } from "./armyEvent.js";

export const EntityDownEvent = function() {}

EntityDownEvent.prototype = Object.create(ArmyEvent.prototype);
EntityDownEvent.prototype.constructor = EntityDownEvent;

EntityDownEvent.createEvent = function(entityID, actorID, damage, reason) {
    return {
        "entityID": entityID,
        "actorID": actorID,
        "damage": damage,
        "reason": reason
    }
}