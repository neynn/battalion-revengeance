import { WorldEvent } from "./worldEvent.js";

export const EventHandler = function() {
    this.events = [];
}

EventHandler.prototype.exit = function() {
    this.events.length = 0;
}

EventHandler.prototype.addEvent = function(event) {
    this.events.push(event);
}

EventHandler.prototype.onTurnChange = function(gameContext, globalTurn) {
    for(const event of this.events) {
        const { turn } = event;

        if(turn !== WorldEvent.INVALID_TIME && globalTurn >= turn) {
            this.triggerEvent(gameContext, event);
        }
    }
}

EventHandler.prototype.onRoundChange = function(gameContext, globalRound) {
    for(const event of this.events) {
        const { round } = event;

        if(round !== WorldEvent.INVALID_TIME && globalRound >= round) {
            this.triggerEvent(gameContext, event);
        }
    }
}

EventHandler.prototype.triggerEvent = function(gameContext, event) {
    const MAX_DEPTH = 10;
    let depth = 0;
    let currentEvent = event;

    while(depth < MAX_DEPTH && currentEvent !== null) {
        const { isTriggered, next } = currentEvent;

        if(isTriggered) {
            break;
        }

        currentEvent.trigger(gameContext);

        if(next !== null) {
            currentEvent = this.getEvent(next);
        } else {
            currentEvent = null;
        }

        depth++;
    }
}

EventHandler.prototype.getEvent = function(eventID) {
    for(const event of this.events) {
        const { id } = event;

        if(id === eventID) {
            return event;
        }
    }

    return null;
}

EventHandler.prototype.triggerEventByID = function(gameContext, eventID) {
    for(const event of this.events) {
        const { id } = event;

        if(id === eventID) {
            this.triggerEvent(gameContext, event);
            break;
        }
    }
}