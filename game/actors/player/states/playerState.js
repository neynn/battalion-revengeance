import { State } from "../../../../engine/state/state.js";
import { Player } from "../player.js";

export const PlayerState = function() {}

PlayerState.prototype = Object.create(State.prototype);
PlayerState.prototype.constructor = PlayerState;

PlayerState.prototype.onTargetChange = function(gameContext, stateMachine) {}
PlayerState.prototype.onTileChange = function(gameContext, stateMachine) {}
PlayerState.prototype.onClick = function(gameContext, stateMachine) {}

PlayerState.prototype.onEvent = function(gameContext, stateMachine, eventID, eventData) {
    switch(eventID) {
        case Player.EVENT.TARGET_CHANGE: {
            this.onTargetChange(gameContext, stateMachine);
            break;
        }
        case Player.EVENT.TILE_CHANGE: {
            this.onTileChange(gameContext, stateMachine);
            break;
        }
        case Player.EVENT.CLICK: {
            this.onClick(gameContext, stateMachine);
            break;
        }
    }
}
