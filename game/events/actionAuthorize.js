import { ArmyEvent } from "./armyEvent.js";

export const ActionAuthorizeEvent = function() {}

ActionAuthorizeEvent.prototype = Object.create(ArmyEvent.prototype);
ActionAuthorizeEvent.prototype.constructor = ActionAuthorizeEvent;

ActionAuthorizeEvent.prototype.onStory = function(gameContext, event) {
    const { world } = gameContext;
    const { actionQueue, turnManager } = world;
    const { choice, actorID } = event;
    const isActor = turnManager.isActor(actorID);

    if(isActor) {
        turnManager.reduceActorActions(1);
    }

    actionQueue.enqueue(choice);
}

ActionAuthorizeEvent.prototype.onVersus = function(gameContext, event) {
    const { world } = gameContext;
    const { actionQueue, turnManager } = world;
    const { choice, actorID } = event;
    const isActor = turnManager.isActor(actorID);

    if(isActor) {
        turnManager.reduceActorActions(1);
    }

    actionQueue.enqueue(choice);
}