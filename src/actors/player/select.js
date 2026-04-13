import { EntityManager } from "../../../engine/entity/entityManager.js";
import { FloodFill } from "../../../engine/pathfinders/floodFill.js";
import { createAttackRequest, createHealRequest, createMoveRequest } from "../../action/actionHelper.js";
import { AUTOTILER_TYPE, COMMAND_TYPE, MOVE_COMMAND, RANGE_TYPE } from "../../enums.js";
import { createStep, isNodeReachable, getBestPath } from "../../systems/pathfinding.js";
import { Player } from "../player.js";
import { PlayerState } from "./playerState.js";

export const SelectState = function() {
    PlayerState.call(this);

    this.targetX = -1;
    this.targetY = -1;
    this.goalX = -1;
    this.goalY = -1;
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
    this.nodeMap = player.inspector.nodeMap;
    this.targetX = entity.tileX;
    this.targetY = entity.tileY;
    this.goalX = entity.tileX;
    this.goalY = entity.tileY;
    this.onTileChange(gameContext, stateMachine, this.targetX, this.targetY);
}

SelectState.prototype.isTargetValid = function(targetX, targetY) {
    return this.path.length !== 0 && this.targetX === targetX && this.targetY === targetY;
}

SelectState.prototype.onTileClick = function(gameContext, stateMachine, tileX, tileY) {
    if(this.isTargetValid(tileX, tileY)) {
        if(this.entity.isMoveTargetValid(gameContext, tileX, tileY)) {
            if(this.entity.isPathWalkable(gameContext, this.path)) {
                const player = stateMachine.getContext();
                const request = createMoveRequest(this.entity.getID(), this.path, MOVE_COMMAND.NONE, EntityManager.INVALID_ID);
        
                player.addIntent(request);
            }
        }
    }

    stateMachine.setNextState(gameContext, Player.STATE.IDLE);
}

SelectState.prototype.splitPath = function() {
    if(this.targetX === this.entity.tileX && this.targetY === this.entity.tileY) {
        this.path.length = 0;
        return true;
    }

    let tileX = this.entity.tileX;
    let tileY = this.entity.tileY;

    for(let i = this.path.length - 1; i >= 0; i--) {
        const { deltaX, deltaY } = this.path[i];

        tileX += deltaX;
        tileY += deltaY;

        if(tileX === this.targetX && tileY === this.targetY) {
            this.path.splice(0, i);
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

    const deltaX = Math.abs(entity.tileX - this.goalX);
    const deltaY = Math.abs(entity.tileY - this.goalY);
    
    if((deltaX + deltaY) !== 1) {
        return false;
    }

    return this.entity.isMoveTargetValid(gameContext, this.goalX, this.goalY) && this.entity.isPathWalkable(gameContext, this.path);
}

SelectState.prototype.setOptimalAttackPath = function(gameContext) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    let bestNode = null;

    for(const [deltaX, deltaY, type] of FloodFill.NEIGHBORS) {
        const neighborX = this.targetX + deltaX;
        const neighborY = this.targetY + deltaY;
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

    this.targetX = tileX;
    this.targetY = tileY;
    this.goalX = this.entity.tileX;
    this.goalY = this.entity.tileY;

    for(let i = this.path.length - 1; i >= 0; i--) {
        const { deltaX, deltaY } = this.path[i];

        this.goalX += deltaX;
        this.goalY += deltaY;
    }

    const deltaX = this.targetX - this.goalX;
    const deltaY = this.targetY - this.goalY;
    const absDelta = Math.abs(deltaX) + Math.abs(deltaY);

    if(entity) {
        if(!this.entity.isAllyWith(gameContext, entity) && this.entity.isAttackValid(gameContext, entity)) {
            switch(this.entity.getRangeType()) {
                case RANGE_TYPE.RANGE: {
                    //Remove the path if the entity is a ranged attacker.
                    this.path.length = 0;
                    break;
                }
                case RANGE_TYPE.MELEE:
                case RANGE_TYPE.HYBRID: {
                    //Recalculates the optimal attack path if the current does not work.
                    if(!this.isAttackPathValid(gameContext, entity)) {
                        this.setOptimalAttackPath(gameContext);
                    }

                    break;
                }
                default: {
                    console.warn("Invalid range type!");
                    break;
                }
            }

            player.camera.showEntityPath(attackAutotiler, this.path, this.entity.tileX, this.entity.tileY);
            return;
        }
    }

    if(!targetNode || !isNodeReachable(targetNode)) {
        //No path update if the node is not reachable.
        return;
    }

    //If the next step is valid, then check if the path cuts itself.
    //If the path does not cut itself, then check if it's walkable.
    //If it's not walkable, recalculate the optimal path.
    if(absDelta === 1 && this.path.length > 0) {
        const isSplit = this.splitPath();

        if(!isSplit) {
            this.path.unshift(createStep(deltaX, deltaY));

            if(!this.entity.isPathWalkable(gameContext, this.path)) {
                this.path = getBestPath(gameContext, this.nodeMap, tileX, tileY);
            }
        }
    } else if(absDelta !== 0) {
        this.path = getBestPath(gameContext, this.nodeMap, tileX, tileY);
    }

    player.camera.showEntityPath(walkAutotiler, this.path, this.entity.tileX, this.entity.tileY);

    if(this.entity.isJammer()) {
        player.camera.showEntityJammerAt(gameContext, this.entity, this.targetX, this.targetY);
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
            request = createAttackRequest(this.entity.getID(), entity.getID(), COMMAND_TYPE.ATTACK);
            break;
        }
        case RANGE_TYPE.MELEE:
        case RANGE_TYPE.HYBRID: {
            if(this.path.length === 0) {
                request = createAttackRequest(this.entity.getID(), entity.getID(), COMMAND_TYPE.ATTACK);
            } else {
                request = createMoveRequest(this.entity.getID(), this.path, MOVE_COMMAND.ATTACK, entity.getID());
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
            request = createHealRequest(this.entity.getID(), entity.getID());
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
                    request = createHealRequest(this.entity.getID(), entity.getID());
                    break;
                }
                default: {
                    //Cut the final step (index 0) as the PATH sees an ally as walkable.
                    this.path.shift();
                    request = createMoveRequest(this.entity.getID(), this.path, MOVE_COMMAND.HEAL, entity.getID());
                    break;
                }
            }

            break;
        }
    }

    return request;
}

SelectState.prototype.onEntityClick = function(gameContext, stateMachine, entity) {
    if(entity === this.entity) {
        stateMachine.setNextState(gameContext, Player.STATE.IDLE);
        //TODO: Open ContextMenu.
        return;
    }

    const { teamManager } = gameContext;
    const player = stateMachine.getContext();
    const isAlly = teamManager.isAlly(player.teamID, entity.teamID);
    const isControlled = entity.belongsTo(player.teamID);

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