import { Action } from "../../../engine/action/action.js";
import { WorldEvent } from "../../../engine/world/event/worldEvent.js";

export const RevealEventAction = function() {
    Action.call(this);

    this.effects = [];
    this.time = 0;
}

RevealEventAction.createData = function() {
    return {
        "event": WorldEvent.INVALID_ID
    }
}

RevealEventAction.prototype = Object.create(Action.prototype);
RevealEventAction.prototype.constructor = RevealEventAction;

RevealEventAction.prototype.onStart = function(gameContext, data) {
    const { world } = gameContext;
    const { eventHandler } = world;
    const { event } = data;
    const worldEvent = eventHandler.getEvent(event);

    for(const effect of worldEvent.effects) {
        this.effects.push(effect);
    }
}

RevealEventAction.prototype.isFinished = function(gameContext, executionPlan) {
    return this.time++ >= 300;
}

RevealEventAction.prototype.onEnd = function(gameContext, data) {
    for(const effect of this.effects) {
        effect.play(gameContext);
    }

    this.effects.length = 0;
    this.time = 0;
}

RevealEventAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { event } = actionIntent;
    const data = RevealEventAction.createData();

    data.event = event;

    executionPlan.setData(data);
}