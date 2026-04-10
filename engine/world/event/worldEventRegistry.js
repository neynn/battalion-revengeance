import { WorldEvent } from "./worldEvent.js";

export const WorldEventRegistry = function() {
    this.worldEvents = [];
    this.triggeredEvents = new Set();
    this.nameMap = new Map();
    this.isAuthority = true;
}

WorldEventRegistry.prototype.toAuthority = function() {
    this.isAuthority = true;
}

WorldEventRegistry.prototype.toReceiver = function() {
    this.isAuthority = false;
}

WorldEventRegistry.prototype.exit = function() {
    this.worldEvents.length = 0;
    this.triggeredEvents.clear();
    this.isAuthority = true;
}

WorldEventRegistry.prototype.createEvent = function(name) {
    const eventID = this.worldEvents.length;
    const event = new WorldEvent(eventID, name);

    this.worldEvents.push(event);
    this.nameMap.set(name, eventID);

    return event;
}

WorldEventRegistry.prototype.getTriggerableEvents = function(turn, round) {
    const events = [];

    if(!this.isAuthority) {
        return events;
    }

    const MAX_DEPTH = 10;

    for(const event of this.worldEvents) {
        if(this.triggeredEvents.has(event.id)) {
            continue;
        }

        if(event.isTriggeredByTurn(turn) || event.isTriggeredByRound(round)) {
            let depth = 0;
            let currentEvent = event;

            while(depth < MAX_DEPTH && currentEvent !== null) {
                const { id, next } = currentEvent;

                if(this.triggeredEvents.has(id)) {
                    break;
                }

                this.triggeredEvents.add(id);

                events.push(currentEvent);

                if(next !== null) {
                    currentEvent = this.getEventByName(next);
                } else {
                    currentEvent = null;
                }

                depth++;
            }
        }
    }

    return events;
}

WorldEventRegistry.prototype.loadTriggeredEvents = function(events) {
    for(const eventID of events) {
        this.triggeredEvents.add(eventID);
    }
}

WorldEventRegistry.prototype.saveTriggeredEvents = function() {
    const events = [];

    for(const eventID of this.triggeredEvents) {
        events.push(eventID);
    }

    return events;
}

WorldEventRegistry.prototype.getEventByName = function(name) {
    const eventID = this.nameMap.get(name);

    if(eventID === undefined) {
        return null;
    }

    return this.getEvent(eventID);
}

WorldEventRegistry.prototype.getEvent = function(eventID) {
    if(eventID < 0 || eventID >= this.worldEvents.length) {
        return null;
    }

    return this.worldEvents[eventID];
}