import { Action } from "../../../engine/action/action.js";
import { FlagHelper } from "../../../engine/flagHelper.js";
import { COMMAND_TYPE, PATH_INTERCEPT } from "../../enums.js";
import { placeEntityOnMap, removeEntityFromMap } from "../../systems/map.js";
import { TypeRegistry } from "../../type/typeRegistry.js";
import { ActionHelper, createAttackRequest, createInteractionRequest } from "../actionHelper.js";

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

MoveAction.TRAVEL_DISTANCE = 56;

MoveAction.prototype = Object.create(Action.prototype);
MoveAction.prototype.constructor = MoveAction;

MoveAction.prototype.onStart = function(gameContext, data, id) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, path } = data;
    const entity = entityManager.getEntity(entityID);

    removeEntityFromMap(gameContext, entity);

    entity.playMove(gameContext);
    entity.onMoveStart();

    this.path = path;
    this.pathIndex = this.path.length - 1;
    this.entity = entity;
}

MoveAction.prototype.onUpdate = function(gameContext, data, id) {
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

    while(this.distanceMoved >= MoveAction.TRAVEL_DISTANCE && this.pathIndex >= 0) {
        const { tileX, tileY } = this.path[this.pathIndex];
        const positionVec = transform2D.transformTileToWorld(tileX, tileY);
    
        this.entity.setDirectionByDelta(deltaX, deltaY);
        this.entity.setPositionVec(positionVec);
        this.entity.setTile(tileX, tileY);
        this.distanceMoved -= MoveAction.TRAVEL_DISTANCE;
        this.pathIndex--;
    }
}

MoveAction.prototype.isFinished = function(gameContext, executionRequest) {
    return this.pathIndex < 0;
}

MoveAction.prototype.onEnd = function(gameContext, data, id) {
    const { transform2D, teamManager } = gameContext;
    const { flags } = data;
    const { deltaX, deltaY, tileX, tileY } = this.path[0];
    const position = transform2D.transformTileToWorld(tileX, tileY);

    this.entity.setTile(tileX, tileY);
    this.entity.setPositionVec(position);
    this.entity.setDirectionByDelta(deltaX, deltaY);
    this.entity.playIdle(gameContext);
    this.entity.onMoveEnd();

    if(FlagHelper.hasFlag(flags, MoveAction.FLAG.ELUSIVE)) {
        this.entity.triggerElusive();
    }

    placeEntityOnMap(gameContext, this.entity);
    teamManager.broadcastEntityMove(gameContext, this.entity);

    this.path = [];
    this.pathIndex = 0;
    this.entity = null;
    this.distanceMoved = 0;
}

MoveAction.prototype.validate = function(gameContext, executionRequest, requestData) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, path, targetID } = requestData;
    const entity = entityManager.getEntity(entityID);
    const isValid = entity && entity.canAct() && entity.canMove() && !entity.isDead() && entity.isPathValid(gameContext, path);

    if(isValid) {
        const intercept = entity.mInterceptPath(gameContext, path);

        if(path.length === 0 || intercept === PATH_INTERCEPT.ILLEGAL) {
            console.error("EDGE CASE: Stealth unit was too close!");
            return;
        }

        const targetX = path[0].tileX;
        const targetY = path[0].tileY;
        let flags = MoveAction.FLAG.NONE;

        const uncloakedEntities = entity.getUncloakedEntities(gameContext, targetX, targetY);
        const uncloakedIDs = uncloakedEntities.map(e => e.getID());

        if(uncloakedIDs.length === 0) {
            const targetEntity = entityManager.getEntity(targetID);

            if(targetEntity) {
                if(targetEntity.isNextToTile(targetX, targetY)) {
                    executionRequest.addNext(createInteractionRequest(entity, targetEntity, COMMAND_TYPE.CHAIN_AFTER_MOVE));
                }
            } else {
                if(entity.canCloakAt(gameContext, targetX, targetY)) {
                    executionRequest.addNext(ActionHelper.createCloakRequest(entityID));
                }

                if(entity.hasTrait(TypeRegistry.TRAIT_TYPE.ELUSIVE)) {
                    flags = FlagHelper.setFlag(flags, MoveAction.FLAG.ELUSIVE);
                }
            }
        } else {
            executionRequest.addNext(ActionHelper.createUncloakRequest(uncloakedIDs));

            if(entity.hasTrait(TypeRegistry.TRAIT_TYPE.TRACKING)) {
                executionRequest.addNext(createAttackRequest(entityID, uncloakedIDs[0], COMMAND_TYPE.CHAIN_AFTER_MOVE));
            } else {
                if(entity.hasTrait(TypeRegistry.TRAIT_TYPE.ELUSIVE)) {
                    flags = FlagHelper.setFlag(flags, MoveAction.FLAG.ELUSIVE);
                }
            }
        }

        //TODO: Add uncloak after moving.
        //MOVE_CLOAKED -> UNCLOAK -> MOVE_UNCLOAKED
        
        executionRequest.setData({
            "entityID": entityID,
            "path": path,
            "flags": flags
        });
    }
}