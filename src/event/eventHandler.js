import { Event } from "./event.js";

export const EventHandler = function() {
    this.events = [];
}

EventHandler.prototype.exit = function() {
    this.events.length = 0;
}

EventHandler.prototype.loadEvents = function(events) {
    for(const eventName in events) {
        const { globalTurn = -1, next = null, triggers = [] } = events[eventName];
        const nextEvent = events[next] !== undefined ? eventName : null;
        const event = new Event(eventName, globalTurn, nextEvent, triggers);

        this.events.push(event);
    }
}

EventHandler.prototype.onTurn = function(gameContext, globalTurn) {
    for(let i = 0; i < this.events.length; i++) {
        const { turn } = this.events[i];

        if(turn !== -1 && globalTurn >= turn) {
            this.events[i].trigger(gameContext);
        }
    }
}