import { Action } from "../../../engine/action/action.js";
import { FADE_RATE, TILE_WIDTH } from "../../constants.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";
import { COMMAND_TYPE, PATH_INTERCEPT, TEAM_STAT, TRAIT_TYPE } from "../../enums.js";
import { mInterceptMine, mInterceptPath } from "../../systems/pathfinding.js";
import { playUncloakSound } from "../../systems/sound.js";
import { createAttackRequest, createCaptureIntent, createCloakIntent, createDeathIntent, createHealRequest, createMineTriggerIntent, createTrackingIntent, createUncloakIntent } from "../actionHelper.js";

export const MoveAction = function() {
    Action.call(this);

    this.entity = null;
    this.path = [];
    this.pathIndex = 0;
    this.distanceMoved = 0;
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
    ELUSIVE: 1 << 0
};

MoveAction.prototype = Object.create(Action.prototype);
MoveAction.prototype.constructor = MoveAction;

MoveAction.prototype.onStart = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, path } = data;
    const entity = entityManager.getEntity(entityID);

    entity.playMove(gameContext);

    this.path = path;
    this.pathIndex = this.path.length - 1;
    this.entity = entity;
}

MoveAction.prototype.onUpdate = function(gameContext, data) {
    const { timer, transform2D } = gameContext;
    const deltaTime = timer.getFixedDeltaTime();

    switch(this.state) {
        case MoveAction.STATE.NONE: {
            const { deltaX, deltaY } = this.path[this.pathIndex]; 
            const distanceMoved = this.entity.getDistanceMoved(deltaTime);
            const directionChanged = this.entity.setDirectionByDelta(deltaX, deltaY);

            if(directionChanged) {
                this.entity.updateSprite(gameContext);
            }

            this.distanceMoved += distanceMoved;
            this.entity.updatePosition(deltaX * distanceMoved, deltaY * distanceMoved);

            while(this.distanceMoved >= TILE_WIDTH && this.pathIndex >= 0) {
                const { deltaX, deltaY } = this.path[this.pathIndex]; 
                const { tileX, tileY } = this.path[this.pathIndex];
                const positionVec = transform2D.transformTileToWorld(tileX, tileY);
            
                this.entity.setDirectionByDelta(deltaX, deltaY);
                this.entity.setPositionVec(positionVec);
                this.distanceMoved -= TILE_WIDTH;
                this.pathIndex--;

                if(!this.wasDiscovered && this.entity.isDiscoveredByJammerAt(gameContext, tileX, tileY)) {
                    this.state = MoveAction.STATE.DISCOVERED;
                    this.wasDiscovered = true;

                    playUncloakSound(gameContext);
                }
            }

            break;
        }
        case MoveAction.STATE.DISCOVERED: {
            this.opacity += FADE_RATE * deltaTime;

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
    const { transform2D } = gameContext;
    const { deltaX, deltaY, tileX, tileY } = this.path[0];
    const position = transform2D.transformTileToWorld(tileX, tileY);

    this.execute(gameContext, data);
    this.entity.setPositionVec(position);
    this.entity.setDirectionByDelta(deltaX, deltaY);
    this.entity.playIdle(gameContext);

    this.path = [];
    this.pathIndex = 0;
    this.entity = null;
    this.distanceMoved = 0;
    this.state = MoveAction.STATE.NONE;
    this.wasDiscovered = false;
    this.opacity = 0;
}

MoveAction.prototype.execute = function(gameContext, data) {
    const { world, teamManager } = gameContext;
    const { entityManager } = world;
    const { entityID, path, flags } = data;
    const { activeTeams } = teamManager;
    const entity = entityManager.getEntity(entityID);
    const team = entity.getTeam(gameContext);

    entity.removeFromMap(gameContext);
    entity.setFlag(BattalionEntity.FLAG.HAS_MOVED);
    entity.clearFlag(BattalionEntity.FLAG.CAN_MOVE);

    for(let i = path.length - 1; i >= 0; i--) {
        const { tileX, tileY } = path[i];

        entity.setTile(tileX, tileY);

        if(entity.isDiscoveredByJammerAt(gameContext, tileX, tileY)) {
            entity.setUncloaked();
        }
    }

    if(flags & MoveAction.FLAG.ELUSIVE) {
        entity.triggerElusive();
    }

    entity.placeOnMap(gameContext);
    team.addStatistic(TEAM_STAT.UNITS_MOVED, 1);
    
    for(const teamID of activeTeams) {
        const team = teamManager.getTeam(teamID);

        team.onEntityMove(gameContext, entity);
    }

    teamManager.updateStatus();
}

MoveAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, path, targetID } = actionIntent;
    const entity = entityManager.getEntity(entityID);

    if(!entity || !entity.hasFlag(BattalionEntity.FLAG.CAN_MOVE) || entity.hasFlag(BattalionEntity.FLAG.HAS_FIRED)) {
        return;
    }

    if(!entity.canMove() || entity.isDead() || !entity.isPathValid(gameContext, path)) {
        return;
    }

    const { teamID } = entity;
    const intercept = mInterceptPath(gameContext, teamID, path);

    if(path.length === 0 || intercept === PATH_INTERCEPT.ILLEGAL) {
        console.error("EDGE CASE: Stealth unit was too close!");
        return;
    }

    const mineIntercept = mInterceptMine(gameContext, entity, path);

    if(mineIntercept === PATH_INTERCEPT.MINE) {
        executionPlan.addNext(createMineTriggerIntent(entityID));
    }

    const targetX = path[0].tileX;
    const targetY = path[0].tileY;
    const targetEntity = entityManager.getEntity(targetID);
    const uncloakedEntities = entity.getUncloakedEntities(gameContext, targetX, targetY);
    let flags = MoveAction.FLAG.NONE;

    if(targetEntity && targetEntity.isNextToTile(targetX, targetY)) {
        if(entity.isHealValid(gameContext, targetEntity)) {
            executionPlan.addNext(createHealRequest(entityID, targetID, COMMAND_TYPE.ATTACK));
        } else if(entity.isAttackValid(gameContext, targetEntity)) {
            executionPlan.addNext(createAttackRequest(entityID, targetID, COMMAND_TYPE.ATTACK));
        } else {
            console.error("Heal and attack are both invalid!");
        }
    }

    if(uncloakedEntities.length !== 0) {
        const uncloakedIDs = uncloakedEntities.map(e => e.getID());

        executionPlan.addNext(createUncloakIntent(uncloakedIDs));

        if(entity.hasTrait(TRAIT_TYPE.TRACKING)) {
            executionPlan.addNext(createTrackingIntent(entity, uncloakedEntities));
        }
    }

    if(entity.canCapture(gameContext, targetX, targetY)) {
        executionPlan.addNext(createCaptureIntent(entityID, targetX, targetY));
    }

    if(entity.canCloakAt(gameContext, targetX, targetY)) {
        executionPlan.addNext(createCloakIntent(entityID));
    }

    if(entity.hasTrait(TRAIT_TYPE.ELUSIVE)) {
        flags |= MoveAction.FLAG.ELUSIVE;
    }
    
    executionPlan.setData({
        "entityID": entityID,
        "path": path,
        "flags": flags
    });
}