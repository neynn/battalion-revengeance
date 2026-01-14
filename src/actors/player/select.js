import { EntityManager } from "../../../engine/entity/entityManager.js";
import { FloodFill } from "../../../engine/pathfinders/floodFill.js";
import { createAttackRequest, createHealRequest, createMoveRequest } from "../../action/actionHelper.js";
import { AUTOTILER_TYPE, COMMAND_TYPE, RANGE_TYPE } from "../../enums.js";
import { createStep, isNodeReachable, getBestPath } from "../../systems/pathfinding.js";
import { Player } from "../player.js";
import { PlayerState } from "./playerState.js";

export const SelectState = function() {
    PlayerState.call(this);

    this.path = [];
    this.entity = null;
    this.nodeMap = null;
}

SelectState.prototype = Object.create(PlayerState.prototype);
SelectState.prototype.constructor = SelectState;

SelectState.prototype.onExit = function(gameContext, stateMachine) {
    this.path = [];
    this.entity = null;
}

SelectState.prototype.onEnter = function(gameContext, stateMachine, enterData) {
    const { entity } = enterData;

    this.selectEntity(gameContext, stateMachine, entity);
}

SelectState.prototype.selectEntity = function(gameContext, stateMachine, entity) {
    const player = stateMachine.getContext();

    this.entity = entity;
    this.nodeMap = player.nodeMap;
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
            const request = createMoveRequest(this.entity.getID(), this.path, EntityManager.ID.INVALID);

            player.addIntent(request);
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
            //Cuts the path off at the target.
            path.length = i + 1;
            this.path = path.toReversed();
            return true;
        }
    }

    return false;
}

SelectState.prototype.isAttackPathValid = function(gameContext, entity) {
    //Is the entity either next to the target already or will it end up next to it?
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

            if(node && isNodeReachable(node)) {
                if(!bestNode) {
                    bestNode = node;
                } else if(node.cost < bestNode.cost) {
                    bestNode = node;
                }
            }
        }
    }

    if(bestNode) {
        this.path = getBestPath(gameContext, this.nodeMap, bestNode.x, bestNode.y);
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
    const walkAutotiler = tileManager.getAutotilerByID(AUTOTILER_TYPE.PATH);
    const attackAutotiler = tileManager.getAutotilerByID(AUTOTILER_TYPE.PATH);

    if(entity) {
        if(!this.entity.isAllyWith(gameContext, entity)) {
            switch(this.entity.getRangeType()) {
                case RANGE_TYPE.RANGE: {
                    //Remove the path if the entity is a ranged attacker.
                    this.path.length = 0;
                    break;
                }
                case RANGE_TYPE.MELEE:
                case RANGE_TYPE.HYBRID: {
                    if(!this.isAttackPathValid(gameContext, entity)) {
                        //Recalculates the optimal attack path if the current does not work.
                        this.setOptimalAttackPath(gameContext, entity);
                    }

                    break;
                }
                default: {
                    console.warn("Invalid range type!");
                    break;
                }
            }

            player.showPath(attackAutotiler, this.path, this.entity.tileX, this.entity.tileY);
            return;
        }
    }

    if(!targetNode || !isNodeReachable(targetNode)) {
        //No path update if the node is not reachable.
        return;
    }

    const deltaX = tileX - this.getPathX();
    const deltaY = tileY - this.getPathY();
    const absDelta = Math.abs(deltaX) + Math.abs(deltaY);

    //If the next step is valid, then check if the path cuts itself.
    //If the path does not cut itself, then check if it's walkable.
    //If it's not walkable, recalculate the optimal path.
    if(absDelta === 1 && this.path.length > 0) {
        const isSplit = this.splitPath(tileX, tileY);

        if(!isSplit) {
            this.path.unshift(createStep(deltaX, deltaY, tileX, tileY));

            if(!this.entity.isPathWalkable(gameContext, this.path)) {
                this.path = getBestPath(gameContext, this.nodeMap, tileX, tileY);
            }
        }
    } else {
        this.path = getBestPath(gameContext, this.nodeMap, tileX, tileY);
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

SelectState.prototype.getAttackRequest = function(entity) {
    const rangeType = this.entity.getRangeType();
    let request = null;

    switch(rangeType) {
        case RANGE_TYPE.RANGE: {
            request = createAttackRequest(this.entity.getID(), entity.getID(), COMMAND_TYPE.INITIATE);
            break;
        }
        case RANGE_TYPE.MELEE:
        case RANGE_TYPE.HYBRID: {
            if(this.path.length === 0) {
                request = createAttackRequest(this.entity.getID(), entity.getID(), COMMAND_TYPE.INITIATE);
            } else {
                request = createMoveRequest(this.entity.getID(), this.path, entity.getID());
            }

            break;
        }
    }

    return request;
}

SelectState.prototype.getHealRequest = function(entity) {
    const rangeType = this.entity.getRangeType();
    let request = null;

    switch(rangeType) {
        case RANGE_TYPE.RANGE: {
            request = createHealRequest(this.entity.getID(), entity.getID(), COMMAND_TYPE.INITIATE);
            break;
        }
        case RANGE_TYPE.MELEE:
        case RANGE_TYPE.HYBRID: {
            switch(this.path.length) {
                case 0: {
                    //Impossible since the path stretches out under allied units.
                    break;
                }
                case 1: {
                    //The ally is next to the healer, as the path is 1 longer than it should be. It's treated as melee.
                    request = createHealRequest(this.entity.getID(), entity.getID(), COMMAND_TYPE.INITIATE);
                    break;
                }
                default: {
                    //Cut the final step (index 0) as the PATH sees an ally as walkable.
                    this.path.shift();
                    request = createMoveRequest(this.entity.getID(), this.path, entity.getID());
                    break;
                }
            }

            break;
        }
    }

    return request;
} 

SelectState.prototype.onEntityClick = function(gameContext, stateMachine, entity, isAlly, isControlled) {
    if(entity === this.entity) {
        stateMachine.setNextState(gameContext, Player.STATE.IDLE);
        //TODO: Open ContextMenu.
        return;
    }

    const player = stateMachine.getContext();

    if(!isAlly) {
        if(this.entity.isAttackValid(gameContext, entity)) {
            const request = this.getAttackRequest(entity);

            if(request) {
                player.addIntent(request);
            }
        }

        stateMachine.setNextState(gameContext, Player.STATE.IDLE);
    } else {
        if(this.entity.isHealValid(gameContext, entity)) {
            const request = this.getHealRequest(entity);

            if(request) {
                player.addIntent(request);
                stateMachine.setNextState(gameContext, Player.STATE.IDLE);
                return;
            }
        }

        if(isControlled && entity.isSelectable()) {
            this.selectEntity(gameContext, stateMachine, entity);
        } else {
            stateMachine.setNextState(gameContext, Player.STATE.IDLE);
        }
    }
}