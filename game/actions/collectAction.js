import { Action } from "../../engine/action/action.js";
import { ActionRequest } from "../../engine/action/actionRequest.js";
import { ArmyEventHandler } from "../armyEventHandler.js";
import { ACTION_TYPE } from "../enums.js";
import { EntityCollectEvent } from "../events/entityCollect.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { AnimationSystem } from "../systems/animation.js";

export const CollectAction = function() {
    Action.call(this);
}

CollectAction.prototype = Object.create(Action.prototype);
CollectAction.prototype.constructor = CollectAction;

CollectAction.prototype.onStart = function(gameContext, actionData, actionID) {
    const { world }  = gameContext;
    const { entityManager } = world;
    const { entityID } = actionData;
    const entity = entityManager.getEntity(entityID);

    AnimationSystem.stopAttention(entity);
    AnimationSystem.playDelay(gameContext, entity);
}

CollectAction.prototype.onEnd = function(gameContext, actionData, actionID) {
    const { world }  = gameContext;
    const { entityManager, eventBus } = world;
    const { actorID, entityID } = actionData;
    const entity = entityManager.getEntity(entityID);

    eventBus.emit(ArmyEventHandler.TYPE.ENTITY_COLLECT, EntityCollectEvent.createEvent(actorID, entityID));
    entity.getComponent(ArmyEntity.COMPONENT.PRODUCTION).reset();
}

CollectAction.prototype.isFinished = function(gameContext, request) {
    const timeRequired = gameContext.settings.iconDuration;

    return request.timePassed >= timeRequired;
}

CollectAction.prototype.validate = function(gameContext, request) {
    const { world }  = gameContext;
    const { entityManager, turnManager } = world;
    const { actorID, entityID } = request;
    const entity = entityManager.getEntity(entityID);
    const actor = turnManager.getActor(actorID);

    if(!entity || !actor || !entity.isProductionFinished() || !actor.hasEntity(entityID)) {
        return null;
    }

    return {
        "entityID": entityID,
        "actorID": actorID
    };
}

CollectAction.createRequest = function(actorID, entityID) {
    const request = new ActionRequest(ACTION_TYPE.COLLECT, {
        "actorID": actorID,
        "entityID": entityID
    });

    return request;
}