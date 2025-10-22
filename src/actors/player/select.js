import { FlagHelper } from "../../../engine/flagHelper.js";
import { ActionHelper } from "../../action/actionHelper.js";
import { AttackAction } from "../../action/types/attack.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";
import { Player } from "../player.js";
import { PlayerState } from "./playerState.js";

export const SelectState = function() {
    PlayerState.call(this);

    this.lastValidX = -1;
    this.lastValidY = -1;
    this.entity = null;
    this.nodeMap = new Map();
}

SelectState.prototype = Object.create(PlayerState.prototype);
SelectState.prototype.constructor = SelectState;

SelectState.prototype.onExit = function(gameContext, stateMachine) {
    this.lastValidX = -1;
    this.lastValidY = -1;
    this.entity = null;
    this.nodeMap.clear();
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

    this.onTileChange(gameContext, stateMachine, this.entity.tileX, this.entity.tileY);
}

SelectState.prototype.onTileClick = function(gameContext, stateMachine, tileX, tileY) {
    const player = stateMachine.getContext();
    const path = this.entity.getPath(gameContext, this.nodeMap, tileX, tileY);

    if(path.length !== 0) {
        const request = ActionHelper.createMoveRequest(this.entity.getID(), tileX, tileY, null);

        player.queueRequest(request);
        stateMachine.setNextState(gameContext, Player.STATE.IDLE);
    }
}

SelectState.prototype.onTileChange = function(gameContext, stateMachine, tileX, tileY) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const targetNode = this.nodeMap.get(worldMap.getIndex(tileX, tileY));

    //TODO: Add flags like blocked_by_entity.
    //TODO: Check if hovering on an entity. If so, do not update the path.
    if(targetNode && !FlagHelper.hasFlag(targetNode.flags, BattalionEntity.PATH_FLAG.UNREACHABLE)) {
        const player = stateMachine.getContext();
        const path = this.entity.getPath(gameContext, this.nodeMap, tileX, tileY).reverse();

        player.showPath(gameContext, path, this.entity.tileX, this.entity.tileY);

        if(path.length !== 0) {
            this.lastValidX = tileX;
            this.lastValidY = tileY;
        } else {
            this.lastValidX = -1;
            this.lastValidY = -1;
        }
    }
}

SelectState.prototype.onEntityClick = function(gameContext, stateMachine, entity, isAlly, isControlled) {
    if(!isAlly) {
        const player = stateMachine.getContext();

        if(this.entity.isRanged()) {
            if(this.entity.isRangeEnough(gameContext, entity)) {
                const request = ActionHelper.createAttackRequest(this.entity.getID(), entity.getID(), AttackAction.ATTACK_TYPE.INITIATE);

                player.queueRequest(request);
            }
        } else {
            if(this.lastValidX === -1 && this.lastValidY === -1) {
                const request = ActionHelper.createAttackRequest(this.entity.getID(), entity.getID(), AttackAction.ATTACK_TYPE.INITIATE);

                player.queueRequest(request);
            } else {
                const request = ActionHelper.createMoveRequest(this.entity.getID(), this.lastValidX, this.lastValidY, entity.getID());

                player.queueRequest(request);
            }
        }

        stateMachine.setNextState(gameContext, Player.STATE.IDLE);
        return;
    }

    if(entity === this.entity) {
        stateMachine.setNextState(gameContext, Player.STATE.IDLE);
    } else {
        if(isControlled && !entity.isDead()) {
            this.selectEntity(gameContext, stateMachine, entity);
        } else {
            stateMachine.setNextState(gameContext, Player.STATE.IDLE);
        }
    }
}