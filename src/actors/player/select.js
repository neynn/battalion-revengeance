import { EntityManager } from "../../../engine/entity/entityManager.js";
import { FloodFill } from "../../../engine/pathfinders/floodFill.js";
import { AttackActionVTable } from "../../action/types/attack.js";
import { HealVTable } from "../../action/types/heal.js";
import { MoveVTable } from "../../action/types/move.js";
import { AUTOTILER_TYPE, ATTACK_COMMAND_TYPE, HEAL_COMMAND_TYPE, MOVE_COMMAND, RANGE_TYPE } from "../../enums.js";
import { isNodeReachable, getBestPath, fillStep, createStep } from "../../systems/pathfinding.js";
import { Player } from "../player.js";
import { PlayerState } from "./playerState.js";

export const SelectState = function() {
    PlayerState.call(this);

    this.cursorX = -1;
    this.cursorY = -1;
    this.originX = -1;
    this.originY = -1;

    this.path = [];
    this.entity = null;
    this.nodeMap = null;
}

SelectState.prototype = Object.create(PlayerState.prototype);
SelectState.prototype.constructor = SelectState;

SelectState.prototype.onExit = function(gameContext, stateMachine) {
    this.path.length = 0;
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
    this.cursorX = entity.tileX;
    this.cursorY = entity.tileY;
    this.originX = entity.tileX;
    this.originY = entity.tileY;
    this.path.length = 0;
    this.onTileChange(gameContext, stateMachine, this.cursorX, this.cursorY);
}

SelectState.prototype.onTileClick = function(gameContext, stateMachine, tileX, tileY) {
    const { targetX, targetY } = this.getPathTarget();

    if(tileX === targetX && tileY === targetY) {
        if(this.entity.isMoveTargetValid(gameContext, tileX, tileY)) {
            if(this.entity.isPathWalkable(gameContext, this.path)) {
                const player = stateMachine.getContext();
                const request = MoveVTable.createIntent(this.entity.getID(), this.createDefaultPath(), MOVE_COMMAND.NONE, EntityManager.INVALID_ID);
        
                player.addIntent(request);
            }
        }
    }

    stateMachine.setNextState(gameContext, Player.STATE.IDLE);
}

SelectState.prototype.splitPath = function() {
    if(this.cursorX === this.originX && this.cursorY === this.originY) {
        this.path.length = 0;
        return true;
    }

    let tileX = this.originX;
    let tileY = this.originY;

    for(let i = 0; i < this.path.length; i++) {
        const { deltaX, deltaY } = this.path[i];

        tileX += deltaX;
        tileY += deltaY;

        if(tileX === this.cursorX && tileY === this.cursorY) {
            this.path.length = i + 1;

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

    const { targetX, targetY } = this.getPathTarget();
    const deltaX = Math.abs(entity.tileX - targetX);
    const deltaY = Math.abs(entity.tileY - targetY);
    
    if((deltaX + deltaY) !== 1) {
        return false;
    }

    return this.entity.isMoveTargetValid(gameContext, targetX, targetY) && this.entity.isPathWalkable(gameContext, this.path);
}

SelectState.prototype.isHealPathValid = function(gameContext, entity) {
    if(this.path.length === 0) {
        return false;
    }

    if(this.path.length === 1) {
        return true;
    }

    let targetX = this.originX;
    let targetY = this.originY;

    //Ignore the target tile by excluding the last element.
    for(let i = 0; i < this.path.length - 1; i++) {
        const { deltaX, deltaY } = this.path[i];

        targetX += deltaX;
        targetY += deltaY;
    }

    return this.entity.isMoveTargetValid(gameContext, targetX, targetY);
}

SelectState.prototype.setOptimalAttackPath = function(gameContext) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();
    let bestNode = null;

    for(const [deltaX, deltaY, type] of FloodFill.NEIGHBORS) {
        const neighborX = this.cursorX + deltaX;
        const neighborY = this.cursorY + deltaY;
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

SelectState.prototype.getPathTarget = function() {
    let targetX = this.originX;
    let targetY = this.originY;

    for(let i = 0; i < this.path.length; i++) {
        const { deltaX, deltaY } = this.path[i];

        targetX += deltaX;
        targetY += deltaY;
    }

    return {
        "targetX": targetX,
        "targetY": targetY
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
    const { targetX, targetY } = this.getPathTarget();

    this.cursorX = tileX;
    this.cursorY = tileY;

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

            player.renderer.showEntityPath(attackAutotiler, this.path, this.originX, this.originY);
            return;
        }
    }

    if(!targetNode || !isNodeReachable(targetNode)) {
        //No path update if the node is not reachable.
        return;
    }

    const deltaX = this.cursorX - targetX;
    const deltaY = this.cursorY - targetY;
    const absDelta = Math.abs(deltaX) + Math.abs(deltaY);

    //If the next step is valid, then check if the path cuts itself.
    //If the path does not cut itself, then check if it's walkable.
    //If it's not walkable, recalculate the optimal path.
    if(absDelta === 1 && this.path.length > 0) {
        const isSplit = this.splitPath();

        if(!isSplit) {
            this.path.push(fillStep(deltaX, deltaY));

            if(!this.entity.isPathWalkable(gameContext, this.path)) {
                this.path = getBestPath(gameContext, this.nodeMap, tileX, tileY);
            }
        }
    } else if(absDelta !== 0) {
        this.path = getBestPath(gameContext, this.nodeMap, tileX, tileY);
    }

    player.renderer.showEntityPath(walkAutotiler, this.path, this.originX, this.originY);

    if(this.entity.isJammer()) {
        player.renderer.showEntityJammerAt(gameContext, this.entity, this.cursorX, this.cursorY);
    }
}

SelectState.prototype.onBuildingClick = function(gameContext, stateMachine, building) {
    const { tileX, tileY } = building;

    this.onTileClick(gameContext, stateMachine, tileX, tileY);
}

SelectState.prototype.createDefaultPath = function() {
    const defaultPath = [];

    for(let i = 0; i < this.path.length; i++) {
        const { deltaX, deltaY } = this.path[i];
        const step = createStep(deltaX, deltaY);

        step.deltaX = deltaX;
        step.deltaY = deltaY;

        defaultPath.push(step);
    }

    return defaultPath;
}

SelectState.prototype.createHealPath = function() {
    const healPath = [];

    //Since the healer can pass through friendly entities the last element has to be ignored.
    for(let i = 0; i < this.path.length - 1; i++) {
        const { deltaX, deltaY } = this.path[i];
        const step = createStep(deltaX, deltaY);

        step.deltaX = deltaX;
        step.deltaY = deltaY;

        healPath.push(step);
    }

    return healPath;
}

SelectState.prototype.getAttackRequest = function(entity) {
    const rangeType = this.entity.getRangeType();
    let request = null;

    switch(rangeType) {
        case RANGE_TYPE.RANGE: {
            request = AttackActionVTable.createIntent(this.entity.getID(), entity.getID(), ATTACK_COMMAND_TYPE.DIRECT);
            break;
        }
        case RANGE_TYPE.MELEE:
        case RANGE_TYPE.HYBRID: {
            if(this.path.length === 0) {
                request = AttackActionVTable.createIntent(this.entity.getID(), entity.getID(), ATTACK_COMMAND_TYPE.DIRECT);
            } else {
                request = MoveVTable.createIntent(this.entity.getID(), this.createDefaultPath(), MOVE_COMMAND.ATTACK, entity.getID());
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
            request = HealVTable.createIntent(this.entity.getID(), entity.getID(), HEAL_COMMAND_TYPE.DIRECT);
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
                    request = HealVTable.createIntent(this.entity.getID(), entity.getID(), HEAL_COMMAND_TYPE.DIRECT);
                    break;
                }
                default: {
                    //Cut the final step (index 0) as the PATH sees an ally as walkable.
                    request = MoveVTable.createIntent(this.entity.getID(), this.createHealPath(), MOVE_COMMAND.HEAL, entity.getID());
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

            //Clears visual overlays when clicking on an enemy entity.
            player.renderer.clearOverlays();
        }

        stateMachine.setNextState(gameContext, Player.STATE.IDLE);
    } else {
        if(this.entity.isHealValid(gameContext, entity)) {
            const request = this.getHealRequest(entity);

            //Clears visual overlays when clicking on an enemy entity.
            player.renderer.clearOverlays();

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