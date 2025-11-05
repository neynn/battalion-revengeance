import { FloodFill } from "../../../engine/pathfinders/floodFill.js";
import { ActionHelper } from "../../action/actionHelper.js";
import { AttackAction } from "../../action/types/attack.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";
import { TypeRegistry } from "../../type/typeRegistry.js";
import { Player } from "../player.js";
import { PlayerState } from "./playerState.js";

export const SelectState = function() {
    PlayerState.call(this);

    this.path = [];
    this.entity = null;
    this.nodeMap = new Map();
}

SelectState.prototype = Object.create(PlayerState.prototype);
SelectState.prototype.constructor = SelectState;

SelectState.prototype.onExit = function(gameContext, stateMachine) {
    this.path = [];
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

SelectState.prototype.isTargetValid = function(targetX, targetY) {
    return this.path.length !== 0 && this.path[0].tileX === targetX && this.path[0].tileY === targetY;
}

SelectState.prototype.onTileClick = function(gameContext, stateMachine, tileX, tileY) {
    if(this.isTargetValid(tileX, tileY)) {
        const isValid = this.entity.isPathValid(gameContext, this.path);

        if(isValid) {
            const player = stateMachine.getContext();
            const request = ActionHelper.createMoveRequest(this.entity.getID(), this.path, null);

            player.queueRequest(request);
            stateMachine.setNextState(gameContext, Player.STATE.IDLE);
        }
    }
}

SelectState.prototype.getPathX = function() {
    let pathX = 0;

    if(this.path.length === 0) {
        pathX = this.entity.tileX;
    } else {
        pathX = this.path[0].tileX;
    }

    return pathX;
}

SelectState.prototype.getPathY = function() {
    let pathY = 0;

    if(this.path.length === 0) {
        pathY = this.entity.tileY;
    } else {
        pathY = this.path[0].tileY;
    }

    return pathY;
}

SelectState.prototype.splitPath = function(targetX, targetY) {
    if(targetX === this.entity.tileX && targetY === this.entity.tileY) {
        this.path.length = 0;
        return true;
    }

    const path = this.path.toReversed();

    for(let i = 0; i < path.length; i++) {
        if(path[i].tileX === targetX && path[i].tileY === targetY) {
            path.length = i + 1;
            this.path = path.toReversed();
            return true;
        }
    }

    return false;
}

SelectState.prototype.isAttackPathValid = function(gameContext, entity) {
    if(this.path.length === 0) {
        return this.entity.getDistanceToEntity(entity) === 1;
    }

    const finalX = this.path[0].tileX;
    const finalY = this.path[0].tileY;
    const deltaX = Math.abs(entity.tileX - finalX);
    const deltaY = Math.abs(entity.tileY - finalY);

    return (deltaX + deltaY) === 1 && this.entity.isPathValid(gameContext, this.path);
}

SelectState.prototype.setOptimalAttackPath = function(gameContext, entity) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    const { tileX, tileY } = entity;
    let bestNode = null;

    for(const [deltaX, deltaY, type] of FloodFill.NEIGHBORS) {
        const neighborX = tileX + deltaX;
        const neighborY = tileY + deltaY;
        const isOccupied = worldMap.isTileOccupied(neighborX, neighborY);

        if(!isOccupied) {
            const index = worldMap.getIndex(neighborX, neighborY);
            const node = this.nodeMap.get(index);

            if(node && BattalionEntity.isNodeReachable(node)) {
                if(!bestNode) {
                    bestNode = node;
                } else if(node.cost < bestNode.cost) {
                    bestNode = node;
                }
            }
        }
    }

    if(bestNode) {
        this.path = this.entity.getBestPath(gameContext, this.nodeMap, bestNode.x, bestNode.y);
    } else {
        this.path.length = 0;
    }
}

SelectState.prototype.onTileChange = function(gameContext, stateMachine, tileX, tileY) {
    const { world, tileManager } = gameContext;
    const { mapManager } = world;
    const player = stateMachine.getContext();
    const worldMap = mapManager.getActiveMap();
    const targetNode = this.nodeMap.get(worldMap.getIndex(tileX, tileY));
    const entity = player.getVisibleEntity(gameContext, tileX, tileY);
    const walkAutotiler = tileManager.getAutotilerByID(TypeRegistry.AUTOTILER_ID.PATH);
    const attackAutotiler = tileManager.getAutotilerByID(TypeRegistry.AUTOTILER_ID.PATH);

    if(entity && !this.entity.isAllyWith(gameContext, entity)) {
        if(this.entity.getRangeType() === BattalionEntity.RANGE_TYPE.RANGE) {
            this.path.length = 0;
        } else if(!this.isAttackPathValid(gameContext, entity)){
            this.setOptimalAttackPath(gameContext, entity);
        }

        player.showPath(attackAutotiler, this.path, this.entity.tileX, this.entity.tileY);
        return;
    }

    if(!targetNode || !BattalionEntity.isNodeReachable(targetNode)) {
        return;
    }

    const deltaX = tileX - this.getPathX();
    const deltaY = tileY - this.getPathY();
    const absDelta = Math.abs(deltaX) + Math.abs(deltaY);

    if(absDelta === 1 && this.path.length > 0) {
        const isSplit = this.splitPath(tileX, tileY);

        if(!isSplit) {
            this.path.unshift(BattalionEntity.createStep(deltaX, deltaY, tileX, tileY));

            if(!this.entity.isPathValid(gameContext, this.path)) {
                this.path = this.entity.getBestPath(gameContext, this.nodeMap, tileX, tileY);
            }
        }
    } else {
        this.path = this.entity.getBestPath(gameContext, this.nodeMap, tileX, tileY);
    }

    player.showPath(walkAutotiler, this.path, this.entity.tileX, this.entity.tileY);

    if(this.entity.isJammer()) {
        const pathX = this.getPathX();
        const pathY = this.getPathY();

        player.showJammerAt(gameContext, this.entity, pathX, pathY);
    }
}

SelectState.prototype.onBuildingClick = function(gameContext, stateMachine, building) {
    const { tileX, tileY } = building;

    this.onTileClick(gameContext, stateMachine, tileX, tileY);
}

SelectState.prototype.onEntityClick = function(gameContext, stateMachine, entity, isAlly, isControlled) {
    if(!isAlly) {
        let request = null;
        const player = stateMachine.getContext();
        const rangeType = this.entity.getRangeType();

        switch(rangeType) {
            case BattalionEntity.RANGE_TYPE.MELEE: {
                if(this.path.length === 0) {
                    request = ActionHelper.createAttackRequest(this.entity.getID(), entity.getID(), AttackAction.COMMAND.INITIATE);
                } else {
                    request = ActionHelper.createMoveRequest(this.entity.getID(), this.path, entity.getID());
                }

                break;
            }
            case BattalionEntity.RANGE_TYPE.RANGE: {
                if(this.entity.canTarget(gameContext, entity)) {
                    request = ActionHelper.createAttackRequest(this.entity.getID(), entity.getID(), AttackAction.COMMAND.INITIATE);
                }

                break;
            }
            case BattalionEntity.RANGE_TYPE.HYBRID: {
                if(this.path.length === 0) {
                    request = ActionHelper.createAttackRequest(this.entity.getID(), entity.getID(), AttackAction.COMMAND.INITIATE);
                } else {
                    request = ActionHelper.createMoveRequest(this.entity.getID(), this.path, entity.getID());
                }

                break;
            }
        }

        if(request) {
            player.queueRequest(request);
        }

        stateMachine.setNextState(gameContext, Player.STATE.IDLE);
        return;
    }

    if(entity === this.entity) {
        stateMachine.setNextState(gameContext, Player.STATE.IDLE);
        //TODO: Open ContextMenu.
    } else {
        if(isControlled && entity.isSelectable()) {
            this.selectEntity(gameContext, stateMachine, entity);
        } else {
            stateMachine.setNextState(gameContext, Player.STATE.IDLE);
        }
    }
}