export const WorldEventRegistry = function() {
    this.worldEvents = [];
    this.triggeredEvents = new Set();
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

WorldEventRegistry.prototype.addEvent = function(event) {
    this.worldEvents.push(event);
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
                    currentEvent = this.getEvent(next);
                } else {
                    currentEvent = null;
                }

                depth++;
            }
        }
    }

    return events;
}


WorldEventRegistry.prototype.cleanup = function() {
    for(let i = this.worldEvents.length - 1; i >= 0; i--) {
        if(this.triggeredEvents.has(this.worldEvents[i].id)) {
            this.triggeredEvents.delete(this.worldEvents[i].id);
            this.worldEvents[i] = this.worldEvents[this.worldEvents.length - 1];
            this.worldEvents.pop();
        }
    }
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

WorldEventRegistry.prototype.getEvent = function(eventID) {
    for(const event of this.worldEvents) {
        const { id } = event;

        if(id === eventID) {
            return event;
        }
    }

    return null;
}