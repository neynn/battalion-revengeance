import { EntityHelper } from "../../../engine/entity/entityHelper.js";
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
    if(this.lastValidX === tileX && this.lastValidY === tileY) {
        const player = stateMachine.getContext();
        const path = this.entity.createPath(gameContext, this.nodeMap, this.lastValidX, this.lastValidY);

        if(path.length !== 0) {
            const request = ActionHelper.createMoveRequest(this.entity.getID(), path, null);

            player.queueRequest(request);
            stateMachine.setNextState(gameContext, Player.STATE.IDLE);
        }
    }
}

SelectState.prototype.getTileDelta = function(tileX, tileY) {
    if(this.lastValidX === -1 && this.lastValidY === -1) {
        return 0;
    }

    const deltaX = Math.abs(this.lastValidX - tileX);
    const deltaY = Math.abs(this.lastValidY - tileY);

    return deltaX + deltaY;
}

SelectState.prototype.onTileChange = function(gameContext, stateMachine, tileX, tileY) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const targetNode = this.nodeMap.get(worldMap.getIndex(tileX, tileY));
    const entity = EntityHelper.getTileEntity(gameContext, tileX, tileY);

    if(entity) {
        if(!this.entity.isAllyWith(gameContext, entity)) {
            //TODO: if the player hovers on an enemy and the lastValid is on an ally, then find the best path to the target
            return;
        }
    }

    //TODO: Add flags like blocked_by_entity.
    //TODO: Check if hovering on an entity. If so, do not update the path.
    //TODO: Each tile gets put ON the path, if its a delta of exactly one
    //Check tile delta, if its 1 AND the tile is NOT in the path, then add it to it.
    if(targetNode && !FlagHelper.hasFlag(targetNode.flags, BattalionEntity.PATH_FLAG.UNREACHABLE)) {
        const delta = this.getTileDelta(tileX, tileY);

        if(delta === 1) {

        }

        const player = stateMachine.getContext();
        const path = this.entity.createPath(gameContext, this.nodeMap, tileX, tileY).reverse();

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
                const path = this.entity.createPath(gameContext, this.nodeMap, this.lastValidX, this.lastValidY);
                const request = ActionHelper.createMoveRequest(this.entity.getID(), path, entity.getID());

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