import { Action } from "../../../engine/action/action.js";
import { EntitySpawner } from "../../entity/entitySpawner.js";

export const MoveAction = function() {
    Action.call(this);

    this.nodeMap = new Map();
    this.path = [];
}

MoveAction.prototype = Object.create(Action.prototype);
MoveAction.prototype.constructor = MoveAction;

MoveAction.prototype.onStart = function(gameContext, data, id) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, path } = data;
    const entity = entityManager.getEntity(entityID);

    EntitySpawner.removeEntity(gameContext, entity);

    this.path = path;
}

MoveAction.prototype.isFinished = function(gameContext, executionRequest) {
    return true;
}

MoveAction.prototype.onEnd = function(gameContext, data, id) {
    const { world, transform2D } = gameContext;
    const { entityManager } = world;
    const { entityID, targetX, targetY } = data;
    const entity = entityManager.getEntity(entityID);
    const position = transform2D.transformTileToWorld(targetX, targetY);

    entity.setTile(targetX, targetY);
    entity.setPosition(position);

    EntitySpawner.placeEntity(gameContext, entity);

    this.nodeMap.clear();
    this.path = [];
}

MoveAction.prototype.getValidated = function(gameContext, requestData) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, targetX, targetY } = requestData;
    const entity = entityManager.getEntity(entityID);

    if(entity) {
        entity.mGetNodeMap(gameContext, this.nodeMap);

        const path = entity.getPath(gameContext, this.nodeMap, targetX, targetY);

        if(path.length !== 0) {
            return {
                "entityID": entityID,
                "targetX": targetX,
                "targetY": targetY,
                "path": path
            }
        }
    }


    return null;
}

MoveAction.prototype.onValid = function(gameContext) {
    this.nodeMap.clear();
}

MoveAction.prototype.onInvalid = function(gameContext) {
    this.nodeMap.clear();
}