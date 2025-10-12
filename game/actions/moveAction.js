import { Action } from "../../engine/action/action.js";
import { MoveSystem } from "../systems/move.js";
import { PathfinderSystem } from "../systems/pathfinder.js";
import { ACTION_TYPE } from "../enums.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { ConquerSystem } from "../systems/conquer.js";
import { MapSystem } from "../systems/map.js";
import { ActionRequest } from "../../engine/action/actionRequest.js";
import { CounterMoveAction } from "./counterMoveAction.js";
import { ArmyEventHandler } from "../armyEventHandler.js";
import { EntityMoveEvent } from "../events/entityMove.js";

export const MoveAction = function() {
    Action.call(this);
}

MoveAction.prototype = Object.create(Action.prototype);
MoveAction.prototype.constructor = MoveAction;

MoveAction.prototype.onStart = function(gameContext, request) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { targetX, targetY, entityID, path } = request;
    const entity = entityManager.getEntity(entityID);
    const moveComponent = entity.getComponent(ArmyEntity.COMPONENT.MOVE);

    moveComponent.setPath(path);
    entity.playSound(gameContext, ArmyEntity.SOUND_TYPE.MOVE);
    entity.lookAtTarget(targetX, targetY);
    entity.updateSpriteDirectonal(gameContext, ArmyEntity.SPRITE_TYPE.MOVE, ArmyEntity.SPRITE_TYPE.MOVE_UP);
    MapSystem.removeEntity(gameContext, entity);
}

MoveAction.prototype.onEnd = function(gameContext, request) {
    const { world } = gameContext;
    const { entityManager, actionQueue, eventBus } = world;
    const { actorID, targetX, targetY, entityID, path } = request;
    const entity = entityManager.getEntity(entityID);
    const { x, y } = PathfinderSystem.getOrigin(targetX, targetY, path);

    MoveSystem.endMove(gameContext, entity, targetX, targetY);
    entity.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.IDLE);
    MapSystem.placeEntity(gameContext, entity);
    eventBus.emit(ArmyEventHandler.TYPE.ENTITY_MOVE, EntityMoveEvent.createEvent(entityID, x, y, targetX, targetY));
    ConquerSystem.tryConquering(gameContext, entity, targetX, targetY, actorID);
    actionQueue.addImmediateRequest(CounterMoveAction.createRequest(entityID));
}

MoveAction.prototype.onUpdate = function(gameContext, request) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID } = request;
    const entity = entityManager.getEntity(entityID);

    MoveSystem.updatePath(gameContext, entity);
}

MoveAction.prototype.isFinished = function(gameContext, request) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { data } = request;
    const { entityID } = data;
    const entity = entityManager.getEntity(entityID);
    const moveComponent = entity.getComponent(ArmyEntity.COMPONENT.MOVE);

    return moveComponent.isPathDone();
}

MoveAction.prototype.validate = function(gameContext, request) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { actorID, entityID, targetX, targetY } = request;
    const entity = entityManager.getEntity(entityID);

    if(!entity) {
        return null;
    }

    const nodeList = PathfinderSystem.generateNodeList(gameContext, entity);
    const path = PathfinderSystem.generateMovePath(nodeList, targetX, targetY);

    if(!path) {
        return null;
    }

    return {
        "actorID": actorID,
        "entityID": entityID,
        "targetX": targetX,
        "targetY": targetY,
        "path": path
    }
}

MoveAction.createRequest = function(actorID, entityID, targetX, targetY) {
    const request = new ActionRequest(ACTION_TYPE.MOVE, {
        "actorID": actorID,
        "entityID": entityID,
        "targetX": targetX,
        "targetY": targetY
    });

    return request
}