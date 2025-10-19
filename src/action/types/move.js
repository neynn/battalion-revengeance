import { Action } from "../../../engine/action/action.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";
import { EntitySpawner } from "../../entity/entitySpawner.js";
import { ActionHelper } from "../actionHelper.js";

export const MoveAction = function() {
    Action.call(this);

    this.entity = null;
    this.path = [];
    this.pathIndex = 0;
    this.distanceMoved = 0;
}

MoveAction.TRAVEL_DISTANCE = 56;

MoveAction.prototype = Object.create(Action.prototype);
MoveAction.prototype.constructor = MoveAction;

MoveAction.prototype.onStart = function(gameContext, data, id) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, path } = data;
    const entity = entityManager.getEntity(entityID);

    entity.playSound(gameContext, BattalionEntity.SOUND_TYPE.MOVE);
    entity.toMove(gameContext);
    EntitySpawner.removeEntity(gameContext, entity);

    this.path = path;
    this.pathIndex = this.path.length - 1;
    this.entity = entity;
}

MoveAction.prototype.onUpdate = function(gameContext, data, id) {
    const { timer, transform2D } = gameContext;
    const deltaTime = timer.getFixedDeltaTime();
    const { deltaX, deltaY } = this.path[this.pathIndex]; 
    const distanceMoved = this.entity.movementSpeed * deltaTime;
    const directionChanged = this.entity.updateDirectionByDelta(deltaX, deltaY);

    if(directionChanged) {
        this.entity.updateSprite(gameContext);
    }

    this.distanceMoved += distanceMoved;
    this.entity.updatePosition(deltaX * distanceMoved, deltaY * distanceMoved);

    while(this.distanceMoved >= MoveAction.TRAVEL_DISTANCE && this.pathIndex >= 0) {
        const { tileX, tileY } = this.path[this.pathIndex];
        const positionVec = transform2D.transformTileToWorld(tileX, tileY);
    
        this.entity.updateDirectionByDelta(deltaX, deltaY);
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
    const { deltaX, deltaY, tileX, tileY } = this.path[0];
    const position = transform2D.transformTileToWorld(tileX, tileY);

    this.entity.setTile(tileX, tileY);
    this.entity.setPositionVec(position);
    this.entity.updateDirectionByDelta(deltaX, deltaY);
    this.entity.toIdle(gameContext);
    this.entity.reduceMove();

    EntitySpawner.placeEntity(gameContext, this.entity);
    teamManager.onEntityMove(gameContext, this.entity);

    this.path = [];
    this.pathIndex = 0;
    this.entity = null;
    this.distanceMoved = 0;
}

MoveAction.prototype.validate = function(gameContext, executionRequest, requestData) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, targetX, targetY } = requestData;
    const entity = entityManager.getEntity(entityID);

    if(entity && entity.hasMoveLeft()) {
        const nodeMap = new Map();

        entity.mGetNodeMap(gameContext, nodeMap);

        const path = entity.getPath(gameContext, nodeMap, targetX, targetY);

        if(path.length !== 0) {
            executionRequest.setData({
                "entityID": entityID,
                "targetX": targetX,
                "targetY": targetY,
                "path": path
            });

            //TODO: Interception.
            if(entity.canCloak()) {
                executionRequest.addNext(ActionHelper.createCloakRequest(entityID));
            }
        }
    }
}