import { Action } from "../../../engine/action/action.js";
import { FIXED_DELTA_TIME, TILE_HEIGHT, TILE_WIDTH } from "../../../engine/engine_constants.js";
import { EntityManager } from "../../../engine/entity/entityManager.js";
import { FADE_RATE } from "../../constants.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";
import { COMMAND_TYPE, MOVE_COMMAND, PATH_INTERCEPT, SOUND_TYPE, TEAM_STAT, TRAIT_TYPE } from "../../enums.js";
import { mInterceptMine, mInterceptPath } from "../../systems/pathfinding.js";
import { playEntitySound, playUncloakSound } from "../../systems/sound.js";
import { updateEntitySprite } from "../../systems/sprite.js";
import { createAttackRequest, createCaptureIntent, createCloakIntent, createHealRequest, createMineTriggerIntent, createUncloakIntent } from "../actionHelper.js";

export const MoveAction = function() {
    Action.call(this);

    this.entity = null;
    this.path = [];
    this.pathIndex = 0;
    this.state = MoveAction.STATE.NONE;
    this.wasDiscovered = false;
    this.opacity = 0;
}

MoveAction.STATE = {
    NONE: 0,
    DISCOVERED: 1
};

MoveAction.FLAG = {
    NONE: 0,
    ELUSIVE: 1 << 0,
    MINE_DISCOVERED: 1 << 1
};

MoveAction.createData = function() {
    return {
        "entityID": EntityManager.INVALID_ID,
        "flags": MoveAction.FLAG.NONE,
        "path": []
    }
}

MoveAction.prototype = Object.create(Action.prototype);
MoveAction.prototype.constructor = MoveAction;

MoveAction.prototype.onStart = function(gameContext, data) {
    const { world } = gameContext;
    const { mapManager, entityManager } = world;
    const { entityID, path } = data;
    const entity = entityManager.getEntity(entityID);
    const worldMap = mapManager.getActiveMap();

    entity.setState(BattalionEntity.STATE.MOVE);
    playEntitySound(gameContext, entity, SOUND_TYPE.MOVE);
    updateEntitySprite(gameContext, entity);

    this.path = path;
    this.pathIndex = this.path.length - 1;
    this.entity = entity;

    worldMap.addMoving(entity.getIndex());
}

MoveAction.prototype.onUpdate = function(gameContext, data) {
    switch(this.state) {
        case MoveAction.STATE.NONE: {
            const { deltaX, deltaY } = this.path[this.pathIndex]; 
            const distanceMoved = this.entity.getDistanceMoved(FIXED_DELTA_TIME);
            const directionChanged = this.entity.setDirectionByDelta(deltaX, deltaY);
            const distanceX = deltaX * distanceMoved;
            const distanceY = deltaY * distanceMoved;

            if(directionChanged) {
                updateEntitySprite(gameContext, this.entity);
            }

            this.entity.updateOffset(distanceX, distanceY);

            //Since deltaX or deltaY must be 0, we can safely use oversteps.
            const overstepX = Math.floor(Math.abs(this.entity.offsetX) / TILE_WIDTH);
            const overstepY = Math.floor(Math.abs(this.entity.offsetY) / TILE_HEIGHT);
            let oversteps = Math.max(overstepX, overstepY);

            while(this.pathIndex >= 0 && oversteps > 0) {
                const { deltaX, deltaY, tileX, tileY } = this.path[this.pathIndex];

                this.entity.clearOffset();
                this.entity.setTile(tileX, tileY);
                this.entity.setDirectionByDelta(deltaX, deltaY);
                this.pathIndex--;
                oversteps--;

                if(!this.wasDiscovered && this.entity.hasFlag(BattalionEntity.FLAG.IS_CLOAKED) && this.entity.isDiscoveredByJammerAt(gameContext, tileX, tileY)) {
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

    return this.pathIndex < 0;
}

MoveAction.prototype.onEnd = function(gameContext, data) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    this.execute(gameContext, data);

    this.entity.setState(BattalionEntity.STATE.IDLE);
    this.entity.clearOffset();

    updateEntitySprite(gameContext, this.entity);

    worldMap.removeMoving(this.entity.getIndex());

    this.path = [];
    this.pathIndex = 0;
    this.entity = null;
    this.state = MoveAction.STATE.NONE;
    this.wasDiscovered = false;
    this.opacity = 0;
}

MoveAction.prototype.execute = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, path, flags } = data;
    const { tileX, tileY, deltaX, deltaY } = path[path.length - 1];
    const entity = entityManager.getEntity(entityID);
    const team = entity.getTeam(gameContext);

    //Remove the entity from the origin.
    //Client would otherwise bug out because it modifies tileX, tileY itself.
    const originX = tileX - deltaX;
    const originY = tileY - deltaY;

    entity.setTile(originX, originY);
    entity.removeFromMap(gameContext);
    entity.setFlag(BattalionEntity.FLAG.HAS_MOVED);
    entity.clearFlag(BattalionEntity.FLAG.CAN_MOVE);

    for(let i = path.length - 1; i >= 0; i--) {
        const { tileX, tileY } = path[i];

        if(entity.hasFlag(BattalionEntity.FLAG.IS_CLOAKED) && entity.isDiscoveredByJammerAt(gameContext, tileX, tileY)) {
            entity.setUncloaked();
            break;
        }
    }

    if(flags & MoveAction.FLAG.ELUSIVE) {
        entity.triggerElusive();
    }

    const lastTileX = path[0].tileX;
    const lastTileY = path[0].tileY;
    const lastDeltaX = path[0].deltaX;
    const lastDeltaY = path[0].deltaY;

    entity.setTile(lastTileX, lastTileY);
    entity.setDirectionByDelta(lastDeltaX, lastDeltaY);
    entity.placeOnMap(gameContext);
    team.addStatistic(TEAM_STAT.UNITS_MOVED, 1);

    if(flags & MoveAction.FLAG.MINE_DISCOVERED) {
        team.addStatistic(TEAM_STAT.MINES_DISCOVERED, 1);
    }
}

MoveAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { entityManager, mapManager } = world;
    const { entityID, path, command, targetID } = actionIntent;
    const entity = entityManager.getEntity(entityID);

    if(!entity || !entity.hasFlag(BattalionEntity.FLAG.CAN_MOVE)) {
        return;
    }

    if(!entity.isMoveable() || entity.isDead() || !entity.isPathValid(gameContext, path)) {
        return;
    }

    const { teamID } = entity;
    const newPath = [];

    //Copies the path, which is essential for keeping the intent valid!
    for(let i = 0; i < path.length; i++) {
        newPath.push(path[i]);
    }

    const intercept = mInterceptPath(gameContext, teamID, newPath);

    if(newPath.length === 0 || intercept === PATH_INTERCEPT.ILLEGAL) {
        console.error("EDGE CASE: Stealth unit was too close!");
        return;
    }

    const mineIntercept = mInterceptMine(gameContext, entity, newPath);

    if(mineIntercept === PATH_INTERCEPT.MINE) {
        executionPlan.addNext(createMineTriggerIntent(entityID));
    } 

    const targetX = newPath[0].tileX;
    const targetY = newPath[0].tileY;
    const worldMap = mapManager.getActiveMap();
    const mine = worldMap.getMine(targetX, targetY);
    let flags = MoveAction.FLAG.NONE;

    if(mine && mine.isHidden() && mine.isEnemy(gameContext, teamID)) {
        flags |= MoveAction.FLAG.MINE_DISCOVERED;
    }

    //Follow-Up commands are ignored if there is no target.
    //Follow-Up commands only work on neighboring entities.
    //If a Follow-Up command is given but is invalid, the move is canceled.
    //Move is NOT canceled if ANY intercept is triggered! Otherwise information might leak.
    switch(command) {
        case MOVE_COMMAND.HEAL: {
            const targetEntity = entityManager.getEntity(targetID);

            if(!targetEntity || !targetEntity.isNextToTile(targetX, targetY)) {
                if(mineIntercept === PATH_INTERCEPT.NONE && intercept === PATH_INTERCEPT.NONE) {
                    return;
                }

                break;
            }

            if(entity.isHealValid(gameContext, targetEntity)) {
                executionPlan.addNext(createHealRequest(entityID, targetID));
            }

            break;
        }
        case MOVE_COMMAND.ATTACK: {
            const targetEntity = entityManager.getEntity(targetID);

            if(!targetEntity || !targetEntity.isNextToTile(targetX, targetY)) {
                if(mineIntercept === PATH_INTERCEPT.NONE && intercept === PATH_INTERCEPT.NONE) {
                    return;
                }

                break;
            }

            if(entity.isAttackValid(gameContext, targetEntity)) {
                executionPlan.addNext(createAttackRequest(entityID, targetID, COMMAND_TYPE.ATTACK));
            }

            break;
        }
    }

    executionPlan.addNext(createUncloakIntent(entityID));

    if(entity.canCapture(gameContext, targetX, targetY)) {
        executionPlan.addNext(createCaptureIntent(entityID, targetX, targetY));
    }

    if(entity.canCloakAt(gameContext, targetX, targetY)) {
        executionPlan.addNext(createCloakIntent(entityID));
    }

    if(entity.hasTrait(TRAIT_TYPE.ELUSIVE)) {
        flags |= MoveAction.FLAG.ELUSIVE;
    }
    
    const data = MoveAction.createData();

    data.entityID = entityID;
    data.flags = flags;
    data.path = newPath;

    executionPlan.setData(data);
}