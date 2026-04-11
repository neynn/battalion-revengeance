import { Action } from "../../../engine/action/action.js";
import { WorldEvent } from "../../../engine/world/event/worldEvent.js";
import { INTERRUPT_TYPE } from "../../enums.js";

export const InterruptAction = function() {
    Action.call(this);
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
            const { effects } = eventHandler.getEvent(event);

            for(const effect of effects) {
                effect.play(gameContext);
            }

            break;
        }
    }

}

InterruptAction.prototype.isFinished = function(gameContext, executionPlan) {
    const { data } = executionPlan;
    const { type, event } = data;
    let isFinished = false;

    switch(type) {
        case INTERRUPT_TYPE.EVENT: {
            const { world } = gameContext;
            const { eventHandler } = world;
            const { effects } = eventHandler.getEvent(event);

            let allFinished = true;

            for(const effect of effects) {
                if(!effect.isFinished(gameContext)) {
                    allFinished = false;
                    break;
                }
            }

            isFinished = allFinished;
            break;
        }
        default: {
            isFinished = true;
            break;
        }
    }

    return isFinished;
}

InterruptAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { eventHandler } = world;
    const { event, type } = actionIntent;
    const worldEvent = eventHandler.getEvent(event);

    if(type === INTERRUPT_TYPE.EVENT && !worldEvent) {
        return;
    }

    const data = InterruptAction.createData();

    data.type = type;
    data.event = event;

    executionPlan.setData(data);
}