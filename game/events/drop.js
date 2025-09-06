import { ArmyEvent } from "./armyEvent.js";

export const DropEvent = function() {}

DropEvent.prototype = Object.create(ArmyEvent.prototype);
DropEvent.prototype.constructor = DropEvent;

DropEvent.prototype.onStory = function(gameContext, event) {
    const { world } = gameContext;
    const { turnManager, mapManager } = world;
    const { receiverID, drops, tileX, tileY } = event;
    const receiver = turnManager.getActor(receiverID);
    const worldMap = mapManager.getActiveMap();

    if(receiver && receiver.inventory) {
        worldMap.createDrops(gameContext, receiver.inventory, drops, tileX, tileY);
    }
}

DropEvent.createEvent = function(receiverID, drops, tileX, tileY) {
    return {
        "receiverID": receiverID,
        "drops": drops,
        "tileX": tileX,
        "tileY": tileY
    }
}