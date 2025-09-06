import { ArmyEvent } from "./armyEvent.js";

export const EntityMoveEvent = function() {}

EntityMoveEvent.prototype = Object.create(ArmyEvent.prototype);
EntityMoveEvent.prototype.constructor = EntityMoveEvent;

EntityMoveEvent.createEvent = function(entityID, startX, startY, endX, endY) {
    return {
        "entityID": entityID,
        "startX": startX,
        "startY": startY,
        "endX": endX,
        "endY": endY
    }
}