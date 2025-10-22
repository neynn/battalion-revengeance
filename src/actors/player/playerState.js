import { State } from "../../../engine/state/state.js";
import { Player } from "../player.js";

export const PlayerState = function() {
    State.call(this);
}

PlayerState.prototype = Object.create(State.prototype);
PlayerState.prototype.constructor = PlayerState;

PlayerState.prototype.onEvent = function(gameContext, stateMachine, eventID, eventData) {
    switch(eventID) {
        case Player.EVENT.ENTITY_CLICK: {
            this.onEntityClick(gameContext, stateMachine, eventData.entity, eventData.isAlly, eventData.isControlled);
            break;
        }
        case Player.EVENT.BUILDING_CLICK: {
            this.onBuildingClick(gameContext, stateMachine, eventData.building);
            break;
        }
        case Player.EVENT.TILE_CLICK: {
            this.onTileClick(gameContext, stateMachine, eventData.x, eventData.y);
            break;
        }
        case Player.EVENT.TILE_CHANGE: {
            this.onTileChange(gameContext, stateMachine, eventData.x, eventData.y);
            break;
        }
    }
}

PlayerState.prototype.onEntityClick = function(gameContext, stateMachine, entity, isAlly, isControlled) {}
PlayerState.prototype.onBuildingClick = function(gameContext, stateMachine, building) {}
PlayerState.prototype.onTileClick = function(gameContext, stateMachine, tileX, tileY) {}
PlayerState.prototype.onTileChange = function(gameContext, stateMachine, tileX, tileY) {}