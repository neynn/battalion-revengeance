import { Player } from "../player.js";
import { PlayerState } from "./playerState.js";

export const IdleState = function() {
    PlayerState.call(this);
}

IdleState.prototype = Object.create(PlayerState.prototype);
IdleState.prototype.constructor = IdleState;

IdleState.prototype.onEnter = function(gameContext, stateMachine, enterData) {
    const player = stateMachine.getContext();

    player.clearOverlays();
}

IdleState.prototype.onEntityClick = function(gameContext, stateMachine, entity, isAlly, isControlled) {
    if(isControlled && entity.isSelectable()) {
        stateMachine.setNextState(gameContext, Player.STATE.SELECT, { "entity": entity });
    }
}