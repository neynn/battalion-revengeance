import { EventEmitter } from "../../events/eventEmitter.js";
import { WorldEvent } from "./worldEvent.js";

export const WorldEventHandler = function() {
    this.worldEvents = [];
    this.triggeredEvents = new Set();
    this.allowSelfExecution = true;

    this.events = new EventEmitter();
    this.events.register(WorldEventHandler.EVENT.WORLD_EVENT_TRIGGERED);
}

WorldEventHandler.EVENT = {
    WORLD_EVENT_TRIGGERED: "WORLD_EVENT_TRIGGERED"
};

WorldEventHandler.prototype.exit = function() {
    this.worldEvents.length = 0;
    this.triggeredEvents.clear();
}

WorldEventHandler.prototype.addEvent = function(event) {
    this.worldEvents.push(event);
}

WorldEventHandler.prototype.onTurnChange = function(gameContext, globalTurn) {
    if(!this.allowSelfExecution) {
        return;
    }

    for(const event of this.worldEvents) {
        const { turn } = event;

        if(turn !== WorldEvent.INVALID_TIME && globalTurn >= turn) {
            this.triggerEvent(gameContext, event);
        }
    }
}

WorldEventHandler.prototype.onRoundChange = function(gameContext, globalRound) {
    if(!this.allowSelfExecution) {
        return;
    }

    for(const event of this.worldEvents) {
        const { round } = event;

        if(round !== WorldEvent.INVALID_TIME && globalRound >= round) {
            this.triggerEvent(gameContext, event);
        }
    }
}

WorldEventHandler.prototype.cleanup = function() {
    for(let i = this.worldEvents.length - 1; i >= 0; i--) {
        if(this.triggeredEvents.has(this.worldEvents[i].id)) {
            this.triggeredEvents.delete(this.worldEvents[i].id);
            this.worldEvents[i] = this.worldEvents[this.worldEvents.length - 1];
            this.worldEvents.pop();
        }
    }
}

WorldEventHandler.prototype.forceTrigger = function(gameContext, eventID) {
    const event = this.getEvent(eventID);

    if(!event || this.triggeredEvents.has(eventID)) {
        return;
    }

    event.execute(gameContext);

    this.triggeredEvents.add(eventID);
}

WorldEventHandler.prototype.triggerEvent = function(gameContext, event) {
    const MAX_DEPTH = 10;
    let depth = 0;
    let currentEvent = event;

    while(depth < MAX_DEPTH && currentEvent !== null) {
        const { id, next } = currentEvent;

        if(this.triggeredEvents.has(id)) {
            break;
        }

        this.triggeredEvents.add(id);

        currentEvent.execute(gameContext);

        this.events.emit(WorldEventHandler.EVENT.WORLD_EVENT_TRIGGERED, {
            "id": id
        });

        if(next !== null) {
            currentEvent = this.getEvent(next);
        } else {
            currentEvent = null;
        }

        depth++;
    }
}

WorldEventHandler.prototype.getEvent = function(eventID) {
    for(const event of this.worldEvents) {
        const { id } = event;

        if(id === eventID) {
            return event;
        }
    }

    return null;
}