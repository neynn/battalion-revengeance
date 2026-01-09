import { WorldEvent } from "./worldEvent.js";

export const WorldEventHandler = function() {
    this.worldEvents = [];
    this.triggeredEvents = new Set();
    this.allowSelfExecution = true;
}

WorldEventHandler.prototype.disableSelf = function() {
    this.allowSelfExecution = false;
}

WorldEventHandler.prototype.enableSelf = function() {
    this.allowSelfExecution = true;
}

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

    this.triggeredEvents.add(eventID);
    
    event.execute(gameContext);
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