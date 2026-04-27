import { Action } from "../../../engine/action/action.js";
import { ActionIntent } from "../../../engine/action/actionIntent.js";
import { ACTION_TYPE } from "../../enums.js";
import { TransportTween } from "../../tween/transportTween.js";

const createToTransportIntent = function() {
    return new ActionIntent(ACTION_TYPE.TO_TRANSPORT, {});
}

const createToTransportData = function() {
    return {

    }
}

const fillToTransportPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID } = actionIntent;
    const entity = entityManager.getEntity(entityID);

    if(!entity) {
        return;
    }
}

const executeToTransport = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID } = data;
    const entity = entityManager.getEntity(entityID);

    //TODO(neyn): Set Transport!
}

export const ToTransportVTable = {
    createIntent: createToTransportIntent,
    createData: createToTransportData,
    fillPlan: fillToTransportPlan,
    execute: executeToTransport
};

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
    const tween = new TransportTween(entity);

    tweenManager.addTween(tween);

    this.tweens.push(tween);
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
    this.tweens.length = 0;
}