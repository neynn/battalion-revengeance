import { Event } from "./event.js";

export const EventHandler = function() {
    this.events = [];
}

EventHandler.prototype.exit = function() {
    this.events.length = 0;
}

EventHandler.prototype.loadEvents = function(events) {
    for(const eventName in events) {
        const { 
            turn,
            round,
            next = null,
            triggers = []
        } = events[eventName];
        const nextEvent = events[next] !== undefined ? eventName : null;
        const event = new Event(eventName, nextEvent, triggers);

        event.setTriggerTime(turn, round);

        this.events.push(event);
    }
}

EventHandler.prototype.onTurn = function(gameContext, globalTurn) {
    for(let i = 0; i < this.events.length; i++) {
        this.events[i].triggerByTurn(gameContext, globalTurn);
    }
}

EventHandler.prototype.onRound = function(gameContext, globalRound) {
    for(let i = 0; i < this.events.length; i++) {
        this.events[i].triggerByRound(gameContext, globalRound);
    }
}

EventHandler.prototype.getEvent = function(eventID) {
    for(let i = 0; i < this.events.length; i++) {
        const event = this.events[i];
        const { id } = event;

        if(id === eventID) {
            return event;
        }
    }

    return null;
}