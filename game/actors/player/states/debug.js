import { PlayerState } from "./playerState.js";

export const PlayerDebugState = function() {}

PlayerDebugState.prototype = Object.create(PlayerState.prototype);
PlayerDebugState.prototype.constructor = PlayerDebugState;

PlayerDebugState.prototype.onEnter = function(gameContext, stateMachine, transition) {
    const player = stateMachine.getContext();

    player.showRange();
    player.hideAttackers(gameContext);
}

PlayerDebugState.prototype.onUpdate = function(gameContext, stateMachine) {}

PlayerDebugState.prototype.onTargetChange = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();

    console.log("TARGET_CHANGE:", player.hover.getEntity(gameContext));
}

PlayerDebugState.prototype.onTileChange = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();

    console.log("TILE_CHANGE:", player.hover.tileX, player.hover.tileY);
}

PlayerDebugState.prototype.onClick = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();

    console.log("ENTITY:", player.hover.getEntity(gameContext));
    console.log("TILE:", player.hover.tileX, player.hover.tileY);
}