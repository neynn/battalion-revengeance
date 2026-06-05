import { Action } from "../../../engine/action/action.js";
import { ActionIntent } from "../../../engine/action/actionIntent.js";
import { EntityManager } from "../../../engine/entity/entityManager.js";
import { mapTransportToEntity, transportToCost } from "../../enumHelpers.js";
import { ACTION_TYPE, ENTITY_TYPE, TRANSPORT_TYPE } from "../../enums.js";
import { TransportTween } from "../../tween/transportTween.js";

const createToTransportIntent = function(entityID, transportID) {
    return new ActionIntent(ACTION_TYPE.TO_TRANSPORT, {
        "entityID": entityID,
        "transportID": transportID
    });
}

const createToTransportData = function() {
    return {
        "entityID": EntityManager.INVALID_ID,
        "entityTypeID": ENTITY_TYPE._INVALID,
        "health": 0,
        "cost": 0
    }
}

const fillToTransportPlan = function(gameContext, executionPlan, actionIntent) {
    const { world, typeRegistry } = gameContext;
    const { entityManager } = world;
    const { entityID, transportID } = actionIntent;
    const entity = entityManager.getEntity(entityID);

    if(!entity || entity.isDead() || entity.isTransporting() || !entity.isAllowedToActAndMove()) {
        return;
    }

    //TODO(neyn): Entities need to decide their valid transport types.
    if(!entity.hasTransport(transportID)) {
        return;
    }
    
    //TODO(neyn): Add transport cost.
    const cost = transportToCost(transportID);
    const team = entity.getTeam(gameContext);
    
    if(!team.hasEnoughCash(cost)) {
        return;
    }
    
    const entityTypeID = mapTransportToEntity(transportID);

    if(entityTypeID === ENTITY_TYPE._INVALID) {
        return;
    }

    const { health } = typeRegistry.getEntityType(entityTypeID);
    const vitality = entity.getVitality();
    const data = createToTransportData();

    data.entityID = entityID;
    data.entityTypeID = entityTypeID;
    data.health = Math.ceil(health * vitality);
    data.cost = cost;

    executionPlan.setData(data);
}

const executeToTransport = function(gameContext, data) {
    const { world, typeRegistry } = gameContext;
    const { entityManager } = world;
    const { entityID, entityTypeID, health, cost } = data;
    const entity = entityManager.getEntity(entityID);
    const entityType = typeRegistry.getEntityType(entityTypeID);
    const team = entity.getTeam(gameContext);

    entity.saveTransport();
    entity.loadConfig(entityType);
    entity.setHealth(health);
    team.reduceCash(cost);
}

export const ToTransportVTable = {
    createIntent: createToTransportIntent,
    createData: createToTransportData,
    fillPlan: fillToTransportPlan,
    execute: executeToTransport
};

/*
BattalionEntity.prototype.fromTransport = function(gameContext) {
    if(this.transportID !== ENTITY_TYPE._INVALID) {
        const { typeRegistry } = gameContext;
        const transportType = typeRegistry.getEntityType(this.transportID);
        const previousHealthFactor = this.health / this.maxHealth;

        this.loadConfig(transportType);
        this.setHealth(this.maxHealth * previousHealthFactor);
        this.transportID = ENTITY_TYPE._INVALID;
    }
}
*/

export const ToTransportAction = function() {
    Action.call(this);

    this.tweens = [];
}

ToTransportAction.prototype = Object.create(Action.prototype);
ToTransportAction.prototype.constructor = ToTransportAction;

ToTransportAction.prototype.onStart = function(gameContext, data) {
    const { world, tweenManager } = gameContext;
    const { entityManager } = world;
    const { entityID } = data;
    const entity = entityManager.getEntity(entityID);
    //const tween = new TransportTween(entity);

    //tweenManager.addTween(tween);

    //this.tweens.push(tween);
}

ToTransportAction.prototype.isFinished = function(gameContext, executionPlan) {
    let isFinished = true;

    for(const tween of this.tweens) {
        if(!tween.isComplete()) {
            isFinished = false;
            break;
        }
    }

    return isFinished;
}

ToTransportAction.prototype.onEnd = function(gameContext, data) {
    const { world, spriteController } = gameContext;
    const { entityManager } = world;
    const { entityID } = data;
    const entity = entityManager.getEntity(entityID);

    spriteController.updateEntitySprite(gameContext, entity);

    this.tweens.length = 0;
}