import { Player } from "../player.js";
import { PlayerState } from "./playerState.js";

export const SelectState = function() {
    PlayerState.call(this);

    this.entity = null;
    this.inContextMenu = false;
    this.nodes = [];
}

SelectState.prototype = Object.create(PlayerState.prototype);
SelectState.prototype.constructor = SelectState;

SelectState.prototype.onExit = function(gameContext, stateMachine) {
    this.entity = null;
    this.nodes.length = 0;
    this.closeContextMenu(gameContext);
}

SelectState.prototype.closeContextMenu = function(gameContext) {
    if(!this.inContextMenu) {
        return;
    }

    this.inContextMenu = false;
}

SelectState.prototype.onEnter = function(gameContext, stateMachine, enterData) {
    const { entity } = enterData;

    this.selectEntity(gameContext, entity);
}

SelectState.prototype.selectEntity = function(gameContext, entity) {
    this.entity = entity;
    console.log(this.entity.getNodeList(gameContext));
}

SelectState.prototype.openContextMenu = function(gameContext, entity) {
    this.inContextMenu = true;
}

SelectState.prototype.onTileClick = function(gameContext, stateMachine, tilex, tileY) {
    //this holds a list of nodes that the entity can go to.
    //when selecting, generate a list of nodes.
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
        if(isControlled && entity.isSelectable()) {
            this.closeContextMenu(gameContext);
            this.selectEntity(gameContext, entity);
        } else {
            stateMachine.setNextState(gameContext, Player.STATE.IDLE);
        }
    }
}