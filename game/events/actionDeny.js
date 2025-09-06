import { ArmyEvent } from "./armyEvent.js";

export const ActionDenyEvent = function() {}

ActionDenyEvent.prototype = Object.create(ArmyEvent.prototype);
ActionDenyEvent.prototype.constructor = ActionDenyEvent;

ActionDenyEvent.prototype.onStory = function(gameContext, event) {
    const { world } = gameContext;
    const { turnManager } = world;
    const { actorID } = event;

    const isActor = turnManager.isActor(actorID);

    if(isActor) {
        turnManager.reduceActorActions(1);
    }
}