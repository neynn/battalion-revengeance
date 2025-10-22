import { ActionHelper } from "../../action/actionHelper.js";
import { AttackAction } from "../../action/types/attack.js";
import { Player } from "../player.js";
import { PlayerState } from "./playerState.js";

export const SelectState = function() {
    PlayerState.call(this);

    this.entity = null;
    this.inContextMenu = false;
    this.nodeMap = new Map();
}

SelectState.prototype = Object.create(PlayerState.prototype);
SelectState.prototype.constructor = SelectState;

SelectState.prototype.onExit = function(gameContext, stateMachine) {
    this.entity = null;
    this.nodeMap.clear();
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

    this.selectEntity(gameContext, stateMachine, entity);
}

SelectState.prototype.selectEntity = function(gameContext, stateMachine, entity) {
    const player = stateMachine.getContext();

    this.nodeMap.clear();
    this.entity = entity;
    this.entity.mGetNodeMap(gameContext, this.nodeMap);

    player.addNodeMapRender(this.nodeMap);
}

SelectState.prototype.openContextMenu = function(gameContext, stateMachine, entity) {
    const player = stateMachine.getContext();

    this.inContextMenu = true;

    player.clearNodeMapRender();
}

SelectState.prototype.onTileClick = function(gameContext, stateMachine, tileX, tileY) {
    const player = stateMachine.getContext();
    const path = this.entity.getPath(gameContext, this.nodeMap, tileX, tileY);

    if(path.length !== 0) {
        const request = ActionHelper.createMoveRequest(this.entity.getID(), tileX, tileY);

        player.queueRequest(request);
        stateMachine.setNextState(gameContext, Player.STATE.IDLE);
    }
}

SelectState.prototype.onTileChange = function(gameContext, stateMachine, tileX, tileY) {
    const player = stateMachine.getContext();

    player.showPath(gameContext, this.entity, this.nodeMap, tileX, tileY);
}

SelectState.prototype.onEntityClick = function(gameContext, stateMachine, entity, isAlly, isControlled) {
    if(!isAlly) {
        const player = stateMachine.getContext();
        const request = ActionHelper.createAttackRequest(this.entity.getID(), entity.getID(), AttackAction.ATTACK_TYPE.INITIATE);

        player.queueRequest(request);
        stateMachine.setNextState(gameContext, Player.STATE.IDLE);
        return;
    }

    //this.entity is always controlled!
    if(entity === this.entity) {
        if(this.inContextMenu) {
            stateMachine.setNextState(gameContext, Player.STATE.IDLE);
        } else {
            this.openContextMenu(gameContext, stateMachine, entity);
        }
    } else {
        if(isControlled && !entity.isDead()) {
            this.closeContextMenu(gameContext);
            this.selectEntity(gameContext, stateMachine, entity);
        } else {
            stateMachine.setNextState(gameContext, Player.STATE.IDLE);
        }
    }
}