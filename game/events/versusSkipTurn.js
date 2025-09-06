import { ArmyEvent } from "./armyEvent.js";

export const VersusSkipTurnEvent = function() {}

VersusSkipTurnEvent.prototype = Object.create(ArmyEvent.prototype);
VersusSkipTurnEvent.prototype.constructor = VersusSkipTurnEvent;

VersusSkipTurnEvent.prototype.onVersus = function(gameContext, event) {
    const { world } = gameContext;
    const { turnManager } = world;
    const { actorID } = event;
    const isActor = turnManager.isActor(actorID);

    if(isActor) {
        turnManager.cancelActorActions();
    }
}