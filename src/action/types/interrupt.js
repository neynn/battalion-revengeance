import { Action } from "../../../engine/action/action.js";
import { WorldEvent } from "../../../engine/world/event/worldEvent.js";
import { INTERRUPT_TYPE } from "../../enums.js";

export const InterruptAction = function() {
    Action.call(this);

    this.effects = [];
    this.time = 0;
}

InterruptAction.createData = function() {
    return {
        "type": INTERRUPT_TYPE.NONE,
        "event": WorldEvent.INVALID_ID
    }
}

InterruptAction.prototype = Object.create(Action.prototype);
InterruptAction.prototype.constructor = InterruptAction;

InterruptAction.prototype.onStart = function(gameContext, data) {
    const { world } = gameContext;
    const { eventHandler } = world;
    const { type, event } = data;

    switch(type) {
        case INTERRUPT_TYPE.EVENT: {
            const worldEvent = eventHandler.getEvent(event);

            for(const effect of worldEvent.effects) {
                this.effects.push(effect);
            }
            
            break;
        }
    }

}

InterruptAction.prototype.isFinished = function(gameContext, executionPlan) {
    return this.time++ >= 300;
}

InterruptAction.prototype.onEnd = function(gameContext, data) {
    for(const effect of this.effects) {
        effect.play(gameContext);
    }

    this.effects.length = 0;
    this.time = 0;
}

InterruptAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { event, type } = actionIntent;
    const data = InterruptAction.createData();

    data.type = type;
    data.event = event;

    executionPlan.setData(data);
}