import { Action } from "../../../engine/action/action.js";
import { EntitySpawner } from "../../entity/entitySpawner.js";
import { ActionHelper } from "../actionHelper.js";
import { AttackAction } from "./attack.js";

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

    entity.playMove(gameContext);
    EntitySpawner.removeEntity(gameContext, entity);

    this.path = path;
    this.pathIndex = this.path.length - 1;
    this.entity = entity;
}

MoveAction.prototype.onUpdate = function(gameContext, data, id) {
    const { timer, transform2D } = gameContext;
    const deltaTime = timer.getFixedDeltaTime();
    const { deltaX, deltaY } = this.path[this.pathIndex]; 
    const distanceMoved = this.entity.getDistanceMoved(deltaTime);
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
    const { cost } = data;
    const position = transform2D.transformTileToWorld(tileX, tileY);

    this.entity.setTile(tileX, tileY);
    this.entity.setPositionVec(position);
    this.entity.updateDirectionByDelta(deltaX, deltaY);
    this.entity.playIdle(gameContext);
    this.entity.reduceMove(cost);
    this.entity.onArrive(gameContext);

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
    const { entityID, path, attackTarget } = requestData;
    const entity = entityManager.getEntity(entityID);

    //If attackTarget, then set the cost of the move action to 0 and immediately queue an attack as next.
    //The attack type is immediate_move which  if it fails to evaluate, then reduce the entities moves by 1 since move had a cost of 0.
    //If it manages to validate, then behave as normal.

    if(entity && entity.hasMoveLeft()) {
        if(entity.isPathValid(gameContext, path)) {
            if(!attackTarget) {
                executionRequest.setData({
                    "entityID": entityID,
                    "path": path,
                    "cost": 1
                });

                //TODO: Interception and uncloak.
                if(entity.canCloak()) {
                    executionRequest.addNext(ActionHelper.createCloakRequest(entityID));
                }
            } else if(!entity.isRanged()){
                executionRequest.setData({
                    "entityID": entityID,
                    "path": path,
                    "cost": 0
                });

                //The type should be initiate_move to allow the resetting of cost.
                //So: Cost must be set by an event.
                //Or: Cost is 1 from the move action and the initiate_move does not care for cost?
                //OR: Reducing cost is an action itself...
                executionRequest.addNext(ActionHelper.createAttackRequest(entityID, attackTarget, AttackAction.ATTACK_TYPE.INITIATE));
            }
        }
    }
}