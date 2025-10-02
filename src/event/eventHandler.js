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
            turn = -1,
            round = -1,
            next = null,
            triggers = []
        } = events[eventName];
        const nextEvent = events[next] !== undefined ? eventName : null;
        const event = new Event(eventName, turn, nextEvent, triggers);

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

EventHandler.prototype.onRound = function(gameContext, globalRound) {
    for(let i = 0; i < this.events.length; i++) {
        const { round } = this.events[i];

        if(round !== -1 && globalRound >= round) {
            this.events[i].trigger(gameContext);
        }
    }
}