import { WorldEvent } from "./worldEvent.js";

export const WorldEventRegistry = function() {
    this.worldEvents = [];
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
        if(event.isTriggerable(turn, round)) {
            let currentEvent = event;
            let depth = 0;

            while(depth < MAX_DEPTH && currentEvent !== null) {
                const { next } = currentEvent;

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
        const event = this.getEvent(eventID);

        if(event) {
            event.state = WorldEvent.STATE.TRIGGERED;
        }
    }
}

WorldEventRegistry.prototype.saveTriggeredEvents = function() {
    const events = [];

    for(let i = 0; i < this.worldEvents.length; i++) {
        if(this.worldEvents[i].state === WorldEvent.STATE.TRIGGERED) {
            events.push(i);
        }
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