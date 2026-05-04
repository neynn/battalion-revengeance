import { Action } from "../../../engine/action/action.js";
import { ActionIntent } from "../../../engine/action/actionIntent.js";
import { EntityManager } from "../../../engine/entity/entityManager.js";
import { mapTransportToEntity, transportToCost } from "../../enumHelpers.js";
import { ACTION_TYPE, ENTITY_TYPE, TRANSPORT_TYPE } from "../../enums.js";
import { canEntityTypeStandOnTile } from "../../systems/pathfinding.js";
import { updateEntitySprite } from "../../systems/sprite.js";
import { TransportTween } from "../../tween/transportTween.js";

const createToTransportIntent = function(entityID) {
    return new ActionIntent(ACTION_TYPE.FROM_TRANSPORT, {
        "entityID": entityID
    });
}

const createFromTransportData = function() {
    return {
        "entityID": EntityManager.INVALID_ID,
        "entityTypeID": ENTITY_TYPE._INVALID,
        "health": 0
    }
}

const fillFromTransportPlan = function(gameContext, executionPlan, actionIntent) {
    const { world, typeRegistry } = gameContext;
    const { entityManager } = world;
    const { entityID } = actionIntent;
    const entity = entityManager.getEntity(entityID);

    if(!entity || entity.isDead() || !entity.isTransporting() || !entity.canActAndMove()) {
        return;
    }

    const { tileX, tileY, teamID, transportID } = entity;

    if(!canEntityTypeStandOnTile(gameContext, transportID, tileX, tileY, teamID)) {
        return;
    }

    const { health } = typeRegistry.getEntityType(transportID);
    const vitality = entity.getVitality();
    const data = createFromTransportData();

    data.entityID = entityID;
    data.entityTypeID = transportID;
    data.health = Math.ceil(health * vitality);

    executionPlan.setData(data);
}

const executeFromTransport = function(gameContext, data) {
    const { world, typeRegistry } = gameContext;
    const { entityManager } = world;
    const { entityID, entityTypeID, health } = data;
    const entity = entityManager.getEntity(entityID);
    const entityType = typeRegistry.getEntityType(entityTypeID);

    entity.clearTransport();
    entity.loadConfig(entityType);
    entity.setHealth(health);
}

export const FromTransportVTable = {
    createIntent: createToTransportIntent,
    createData: createFromTransportData,
    fillPlan: fillFromTransportPlan,
    execute: executeFromTransport
};

export const FromTransportAction = function() {
    Action.call(this);

    this.tweens = [];
}

FromTransportAction.prototype = Object.create(Action.prototype);
FromTransportAction.prototype.constructor = FromTransportAction;

FromTransportAction.prototype.onStart = function(gameContext, data) {
    const { world, tweenManager } = gameContext;
    const { entityManager } = world;
    const { entityID } = data;
    const entity = entityManager.getEntity(entityID);
    //const tween = new TransportTween(entity);

    //tweenManager.addTween(tween);

    //this.tweens.push(tween);
}

FromTransportAction.prototype.isFinished = function(gameContext, executionPlan) {
    let isFinished = true;

    for(const tween of this.tweens) {
        if(!tween.isComplete()) {
            isFinished = false;
            break;
        }
    }

    return isFinished;
}

FromTransportAction.prototype.onEnd = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID } = data;
    const entity = entityManager.getEntity(entityID);

    updateEntitySprite(gameContext, entity);

    this.tweens.length = 0;
}