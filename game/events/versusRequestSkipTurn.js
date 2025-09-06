import { ArmyEvent } from "./armyEvent.js";

export const VersusRequestSkipTurnEvent = function() {}

VersusRequestSkipTurnEvent.prototype = Object.create(ArmyEvent.prototype);
VersusRequestSkipTurnEvent.prototype.constructor = VersusRequestSkipTurnEvent;

VersusRequestSkipTurnEvent.prototype.onVersus = function(gameContext, event) {
    //Send request to skip turn to server.
    //Only works if user is the active actor.
}