import { Action } from "../../../engine/action/action.js";
import { ActionIntent } from "../../../engine/action/actionIntent.js";
import { FIXED_DELTA_TIME, TILE_HEIGHT, TILE_WIDTH } from "../../../engine/engine_constants.js";
import { EntityManager } from "../../../engine/entity/entityManager.js";
import { FADE_RATE } from "../../constants.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";
import { ACTION_TYPE, ATTACK_COMMAND_TYPE, HEAL_COMMAND_TYPE, MOVE_COMMAND, SOUND_TYPE, TEAM_STAT, TRAIT_TYPE } from "../../enums.js";
import { InterceptSystem, PathfinderSystem } from "../../systems/pathfinder.js";
import { createStep } from "../../systems/direction.js";
import { playEntitySound, playUncloakSound } from "../../systems/sound.js";
import { AttackActionVTable } from "./attack.js";
import { CloakActionVTable } from "./cloak.js";
import { HealVTable } from "./heal.js";
import { MineTriggerVTable } from "./mineTrigger.js";
import { UncloakVTable } from "./uncloak.js";
import { StealthSystem } from "../../systems/stealth.js";
import { CombatSystem } from "../../systems/combat.js";

const MOVE_FLAG = {
    NONE: 0
};

const createMoveIntent = function(entityID, path, command, targetID) {
    return new ActionIntent(ACTION_TYPE.MOVE, {
        "entityID": entityID,
        "path": path,
        "command": command,
        "targetID": targetID
    });
}

const createMoveData = function(steps) {
    const path = [];

    for(let i = 0; i < steps; i++) {
        path.push(createStep());
    }

    return {
        "entityID": EntityManager.INVALID_ID,
        "originX": -1,
        "originY": -1,
        "flags": MOVE_FLAG.NONE,
        "path": path
    }
}

const fillMovePlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, path, command, targetID } = actionIntent;
    const entity = entityManager.getEntity(entityID);

    if(!entity || entity.isDead() || !entity.isAllowedToMove() || !entity.isMoveable()) {
        return;
    }

    let targetX = entity.tileX;
    let targetY = entity.tileY;

    for(let i = 0; i < path.length; i++) {
        const { deltaX, deltaY } = path[i];

        targetX += deltaX;
        targetY += deltaY;
    }

    if(!entity.isMoveTargetValid(gameContext, targetX, targetY) || !PathfinderSystem.isPathWalkable(gameContext, entity, path)) {
        return;
    }

    const entityInterception = InterceptSystem.mInterceptEntity(gameContext, entity, path, path.length);

    if(entityInterception.pathLength === 0) {
        console.error("EDGE CASE: Stealth unit was too close!");
        return;
    }

    const mineInterception = InterceptSystem.mInterceptMine(gameContext, entity, path, entityInterception.pathLength);

    if(mineInterception.isIntercepted) {
        executionPlan.addNext(MineTriggerVTable.createIntent(entityID));
    }

    switch(command) {
        //Follow-Up commands are ignored if there is no target.
        //Follow-Up commands only work on neighboring entities.
        //If a Follow-Up command is given but is invalid, the move is canceled.
        //Move is NOT canceled if ANY intercept is triggered! Otherwise information might leak.
        case MOVE_COMMAND.HEAL: {
            const targetEntity = entityManager.getEntity(targetID);

            if(!targetEntity || !targetEntity.isNextToTile(targetX, targetY)) {
                if(!mineInterception.isIntercepted && !entityInterception.isIntercepted) {
                    return;
                }

                break;
            }

            if(CombatSystem.isHealValid(gameContext, entity, targetEntity)) {
                executionPlan.addNext(HealVTable.createIntent(entityID, targetID, HEAL_COMMAND_TYPE.FOLLOW_UP));
            }

            break;
        }
        case MOVE_COMMAND.ATTACK: {
            const targetEntity = entityManager.getEntity(targetID);

            if(!targetEntity || !targetEntity.isNextToTile(targetX, targetY)) {
                if(!mineInterception.isIntercepted && !entityInterception.isIntercepted) {
                    return;
                }

                break;
            }

            if(CombatSystem.isAttackValid(gameContext, entity, targetEntity)) {
                executionPlan.addNext(AttackActionVTable.createIntent(entityID, targetID, ATTACK_COMMAND_TYPE.FOLLOW_UP));
            }

            break;
        }
    }

    executionPlan.addNext(UncloakVTable.createIntent(entityID));

    if(StealthSystem.canEntityCloakAt(gameContext, entity, targetX, targetY)) {
        executionPlan.addNext(CloakActionVTable.createIntent(entityID));
    }
    
    const pathLength = mineInterception.pathLength;
    const data = createMoveData(pathLength);

    data.entityID = entityID;
    data.originX = entity.tileX;
    data.originY = entity.tileY;

    for(let i = 0; i < pathLength; i++) {
        data.path[i].deltaX = path[i].deltaX;
        data.path[i].deltaY = path[i].deltaY;
    }

    executionPlan.setData(data);
}

const executeMove = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, originX, originY, path } = data;
    const entity = entityManager.getEntity(entityID);
    const team = entity.getTeam(gameContext);
    let isDiscovered = false;

    entity.setTile(originX, originY);
    entity.removeFromMap(gameContext);
    entity.consumeMove();

    for(let i = 0; i < path.length; i++) {
        const { deltaX, deltaY } = path[i];

        entity.updateTile(deltaX, deltaY);

        if(!isDiscovered && entity.hasFlag(BattalionEntity.FLAG.IS_CLOAKED) && entity.isDiscoveredByJammer(gameContext)) {
            entity.setUncloaked();
            isDiscovered = true;
        }
    }

    if(entity.hasTrait(TRAIT_TYPE.ELUSIVE)) {
        entity.triggerElusive();
    }

    const lastDeltaX = path[path.length - 1].deltaX;
    const lastDeltaY = path[path.length - 1].deltaY;

    entity.setDirectionByDelta(lastDeltaX, lastDeltaY);
    entity.placeOnMap(gameContext);
    team.addStatistic(TEAM_STAT.UNITS_MOVED, 1);

    if(StealthSystem.isMineDiscoveredBy(gameContext, entity)) {
        team.addStatistic(TEAM_STAT.MINES_DISCOVERED, 1);
    }
}

export const MoveVTable = {
    createIntent: createMoveIntent,
    createData: createMoveData,
    fillPlan: fillMovePlan,
    execute: executeMove
};

export const MoveAction = function() {
    Action.call(this);

    this.entity = null;
    this.path = null;
    this.pathIndex = 0;
    this.state = MoveAction.STATE.NONE;
    this.wasDiscovered = false;
    this.opacity = 0;
}

MoveAction.STATE = {
    NONE: 0,
    DISCOVERED: 1
};

MoveAction.prototype = Object.create(Action.prototype);
MoveAction.prototype.constructor = MoveAction;

MoveAction.prototype.onStart = function(gameContext, data) {
    const { world, spriteController } = gameContext;
    const { mapManager, entityManager } = world;
    const { entityID, path } = data;
    const entity = entityManager.getEntity(entityID);
    const worldMap = mapManager.getActiveMap();

    entityManager.addHot(entity.getIndex());
    entity.setState(BattalionEntity.STATE.MOVE);
    spriteController.updateEntitySprite(gameContext, entity);

    playEntitySound(gameContext, entity, SOUND_TYPE.MOVE);

    this.path = path;
    this.pathIndex = 0;
    this.entity = entity;
}

MoveAction.prototype.onUpdate = function(gameContext, data) {
    const { spriteController } = gameContext;

    switch(this.state) {
        case MoveAction.STATE.NONE: {
            const { deltaX, deltaY } = this.path[this.pathIndex]; 
            const distanceMoved = this.entity.getDistanceMoved(FIXED_DELTA_TIME);
            const directionChanged = this.entity.setDirectionByDelta(deltaX, deltaY);
            const distanceX = deltaX * distanceMoved;
            const distanceY = deltaY * distanceMoved;

            if(directionChanged) {
                spriteController.updateEntitySprite(gameContext, this.entity);
            }

            this.entity.updateOffset(distanceX, distanceY);

            //Since deltaX or deltaY must be 0, we can safely use oversteps.
            const overstepX = Math.floor(Math.abs(this.entity.offsetX) / TILE_WIDTH);
            const overstepY = Math.floor(Math.abs(this.entity.offsetY) / TILE_HEIGHT);
            let oversteps = Math.max(overstepX, overstepY);

            while(this.pathIndex < this.path.length && oversteps > 0) {
                const { deltaX, deltaY } = this.path[this.pathIndex];

                this.entity.clearOffset();
                this.entity.updateTile(deltaX, deltaY);
                this.entity.setDirectionByDelta(deltaX, deltaY);
                this.pathIndex++;
                oversteps--;

                if(!this.wasDiscovered && this.entity.hasFlag(BattalionEntity.FLAG.IS_CLOAKED) && this.entity.isDiscoveredByJammer(gameContext)) {
                    this.state = MoveAction.STATE.DISCOVERED;
                    this.wasDiscovered = true;

                    playUncloakSound(gameContext);
                }
            }

            break;
        }
        case MoveAction.STATE.DISCOVERED: {
            this.opacity += FADE_RATE * FIXED_DELTA_TIME;

            if(this.opacity > 1) {
                this.opacity = 1;
                this.state = MoveAction.STATE.NONE;
            }

            this.entity.setOpacity(this.opacity);

            break;
        }
    }
}

MoveAction.prototype.isFinished = function(gameContext, executionPlan) {
    if(this.wasDiscovered && this.state !== MoveAction.STATE.NONE) {
        return false;
    }

    if(this.pathIndex < this.path.length) {
        return false;
    }

    return true;
}

MoveAction.prototype.onEnd = function(gameContext, data) {
    const { world, spriteController } = gameContext;
    const { entityManager } = world;

    this.entity.setState(BattalionEntity.STATE.IDLE);
    this.entity.clearOffset();
    
    entityManager.removeHot(this.entity.getIndex());
    spriteController.updateEntitySprite(gameContext, this.entity);

    this.path = null;
    this.pathIndex = 0;
    this.entity = null;
    this.state = MoveAction.STATE.NONE;
    this.wasDiscovered = false;
    this.opacity = 0;
}