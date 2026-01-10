import { Action } from "../../../engine/action/action.js";
import { hasFlag } from "../../../engine/util/flag.js";
import { TILE_WIDTH } from "../../constants.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";
import { COMMAND_TYPE, PATH_INTERCEPT } from "../../enums.js";
import { placeEntityOnMap, removeEntityFromMap } from "../../systems/map.js";
import { mInterceptPath } from "../../systems/pathfinding.js";
import { TypeRegistry } from "../../type/typeRegistry.js";
import { ActionHelper, createAttackRequest, createCaptureIntent, createHealRequest, createTrackingIntent } from "../actionHelper.js";

export const MoveAction = function() {
    Action.call(this);

    this.entity = null;
    this.path = [];
    this.pathIndex = 0;
    this.distanceMoved = 0;
}

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
    const { deltaX, deltaY } = this.path[this.pathIndex]; 
    const distanceMoved = this.entity.getDistanceMoved(deltaTime);
    const directionChanged = this.entity.setDirectionByDelta(deltaX, deltaY);

    if(directionChanged) {
        this.entity.updateSprite(gameContext);
    }

    this.distanceMoved += distanceMoved;
    this.entity.updatePosition(deltaX * distanceMoved, deltaY * distanceMoved);

    while(this.distanceMoved >= TILE_WIDTH && this.pathIndex >= 0) {
        const { tileX, tileY } = this.path[this.pathIndex];
        const positionVec = transform2D.transformTileToWorld(tileX, tileY);
    
        this.entity.setDirectionByDelta(deltaX, deltaY);
        this.entity.setPositionVec(positionVec);
        this.distanceMoved -= TILE_WIDTH;
        this.pathIndex--;
    }
}

MoveAction.prototype.isFinished = function(gameContext, executionPlan) {
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
}

MoveAction.prototype.execute = function(gameContext, data) {
    const { world, teamManager } = gameContext;
    const { entityManager } = world;
    const { entityID, path, flags } = data;
    const { tileX, tileY } = path[0];
    const entity = entityManager.getEntity(entityID);

    removeEntityFromMap(gameContext, entity);

    entity.setTile(tileX, tileY);
    entity.setFlag(BattalionEntity.FLAG.HAS_MOVED);
    entity.clearFlag(BattalionEntity.FLAG.CAN_MOVE);

    if(hasFlag(flags, MoveAction.FLAG.ELUSIVE)) {
        entity.triggerElusive();
    }

    placeEntityOnMap(gameContext, entity);

    teamManager.broadcastEntityMove(gameContext, entity);
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
    const intercept = mInterceptPath(gameContext, path, teamID);

    if(path.length === 0 || intercept === PATH_INTERCEPT.ILLEGAL) {
        console.error("EDGE CASE: Stealth unit was too close!");
        return;
    }

    const targetX = path[0].tileX;
    const targetY = path[0].tileY;
    const targetEntity = entityManager.getEntity(targetID);
    const uncloakedEntities = entity.getUncloakedEntities(gameContext, targetX, targetY);
    let flags = MoveAction.FLAG.NONE;

    if(targetEntity && targetEntity.isNextToTile(targetX, targetY)) {
        if(entity.isHealValid(gameContext, targetEntity)) {
            executionPlan.addNext(createHealRequest(entityID, targetID, COMMAND_TYPE.CHAIN_AFTER_MOVE));
        } else if(entity.isAttackValid(gameContext, targetEntity)) {
            executionPlan.addNext(createAttackRequest(entityID, targetID, COMMAND_TYPE.CHAIN_AFTER_MOVE));
        } else {
            console.error("Heal and attack are both invalid!");
        }
    }

    if(uncloakedEntities.length !== 0) {
        const uncloakedIDs = uncloakedEntities.map(e => e.getID());

        executionPlan.addNext(ActionHelper.createUncloakRequest(uncloakedIDs));

        if(entity.hasTrait(TypeRegistry.TRAIT_TYPE.TRACKING)) {
            executionPlan.addNext(createTrackingIntent(entity, uncloakedEntities));
        }
    }

    if(entity.canCapture(gameContext, targetX, targetY)) {
        executionPlan.addNext(createCaptureIntent(entityID, targetX, targetY));
    }

    if(entity.canCloakAt(gameContext, targetX, targetY)) {
        executionPlan.addNext(ActionHelper.createCloakRequest(entityID));
    }

    if(entity.hasTrait(TypeRegistry.TRAIT_TYPE.ELUSIVE)) {
        flags |= MoveAction.FLAG.ELUSIVE;
    }
    
    executionPlan.setData({
        "entityID": entityID,
        "path": path,
        "flags": flags
    });
}