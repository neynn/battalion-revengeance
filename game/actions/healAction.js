import { Action } from "../../engine/action/action.js";
import { ActionRequest } from "../../engine/action/actionRequest.js";
import { Inventory } from "../actors/player/inventory/inventory.js";
import { DefaultTypes } from "../defaultTypes.js";
import { ACTION_TYPE } from "../enums.js";
import { AnimationSystem } from "../systems/animation.js";
import { HealSystem } from "../systems/heal.js";

export const HealAction = function() {
    Action.call(this);
}

HealAction.prototype = Object.create(Action.prototype);
HealAction.prototype.constructor = HealAction;

HealAction.prototype.onStart = function(gameContext, request) {
    const { world } = gameContext;
    const { entityManager, turnManager } = world;
    const { entityID, actorID, transaction } = request;
    const entity = entityManager.getEntity(entityID);
    const actor = turnManager.getActor(actorID);

    entity.endDecay();
    AnimationSystem.playHeal(gameContext, entity);

    if(actor.inventory) {
        actor.inventory.removeByTransaction(transaction);
    }
}

HealAction.prototype.onEnd = function(gameContext, request) {
    const { entityID, actorID, health } = request;

    HealSystem.healEntity(gameContext, entityID, actorID, health);
}

HealAction.prototype.isFinished = function(gameContext, request) {
    const constructionDuration = gameContext.settings.iconDuration;

    return request.timePassed >= constructionDuration;
}

HealAction.prototype.validate = function(gameContext, request) {
    const { world } = gameContext;
    const { entityManager, turnManager } = world;
    const { actorID, entityID } = request;
    const entity = entityManager.getEntity(entityID);

    if(!entity) {
        return null;
    }

    const actor = turnManager.getActor(actorID);

    if(!actor) {
        return null;
    }

    const isHealable = HealSystem.isEntityHealableBy(entity, actor);

    if(!isHealable) {
        return null;
    }

    const missingHealth = entity.getMissingHealth();
    const supplyCost = HealSystem.getSuppliesRequired(entity, missingHealth);
    const transaction = DefaultTypes.createItemTransaction(Inventory.TYPE.RESOURCE, HealSystem.HEAL_RESOURCE, supplyCost);

    return {
        "entityID": entityID,
        "actorID": actorID,
        "health": missingHealth,
        "transaction": transaction
    }
}

HealAction.createRequest = function(actorID, entityID) {
    const request = new ActionRequest(ACTION_TYPE.HEAL, {
        "actorID": actorID,
        "entityID": entityID
    });

    return request;
}