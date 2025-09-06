import { DebrisSystem } from "../systems/debris.js";
import { ArmyEvent } from "./armyEvent.js";

export const DebrisSpawnEvent = function() {}

DebrisSpawnEvent.prototype = Object.create(ArmyEvent.prototype);
DebrisSpawnEvent.prototype.constructor = DebrisSpawnEvent;

DebrisSpawnEvent.prototype.onStory = function(gameContext, event) {
    const { debris } = event;

    DebrisSystem.spawnDebris(gameContext, debris);
}

DebrisSpawnEvent.createEvent = function(debris) {
    return {
        "debris": debris,
        "count": debris.length
    }
}