import { Player } from "../player.js";
import { PlayerState } from "./playerState.js";

export const SelectState = function() {
    PlayerState.call(this);

    this.entity = this.entity;
    this.inContextMenu = false;
}

SelectState.prototype = Object.create(PlayerState.prototype);
SelectState.prototype.constructor = SelectState;

SelectState.prototype.onExit = function(gameContext, stateMachine) {
    this.entity = null;
    this.inContextMenu = false;

    //Close the context menu, if open.
}

SelectState.prototype.onEnter = function(gameContext, stateMachine, enterData) {
    const { entity } = enterData;

    this.selectEntity(gameContext, entity);
}

SelectState.prototype.selectEntity = function(gameContext, entity) {
    this.entity = entity;
}

SelectState.prototype.openContextMenu = function(gameContext, entity) {
    this.inContextMenu = true;
}

SelectState.prototype.onEntityClick = function(gameContext, stateMachine, entity, isAlly, isControlled) {
    if(!isAlly) {
        //Attack
        stateMachine.setNextState(gameContext, Player.STATE.IDLE);
        return;
    }

    //this.entity is always controlled!
    if(entity === this.entity) {
        if(this.inContextMenu) {
            stateMachine.setNextState(gameContext, Player.STATE.IDLE);
        } else {
            this.openContextMenu(gameContext, entity);
        }
    } else {
        if(isControlled) {
            this.selectEntity(gameContext, entity);
        }
    }
}