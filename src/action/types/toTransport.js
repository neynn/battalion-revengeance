import { Action } from "../../../engine/action/action.js";
import { TransportTween } from "../../tween/transportTween.js";

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
    this.execute(gameContext, data);
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

ToTransportAction.prototype.execute = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID } = data;
    const entity = entityManager.getEntity(entityID);

    //TODO(neyn): Set Transport!
}

ToTransportAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID } = actionIntent;
    const entity = entityManager.getEntity(entityID);

    if(!entity) {
        return;
    }
}