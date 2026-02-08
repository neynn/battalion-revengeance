export const WorldEventHandler = function() {
    this.worldEvents = [];
    this.triggeredEvents = new Set();
    this.lastRecentlyTriggered = [];
    this.isAuthority = true;
}

WorldEventHandler.prototype.toAuthority = function() {
    this.isAuthority = true;
}

WorldEventHandler.prototype.toReceiver = function() {
    this.isAuthority = false;
}

WorldEventHandler.prototype.exit = function() {
    this.worldEvents.length = 0;
    this.triggeredEvents.clear();
    this.isAuthority = true;
}

WorldEventHandler.prototype.addEvent = function(event) {
    this.worldEvents.push(event);
}

WorldEventHandler.prototype.clearRecentTriggers = function() {
    this.lastRecentlyTriggered.length = 0;
}

WorldEventHandler.prototype.checkEventTriggers = function(gameContext) {
    if(!this.isAuthority) {
        return;
    }

    const { world } = gameContext;
    const { turnManager } = world;
    const { globalTurn, globalRound } = turnManager;

    for(const event of this.worldEvents) {
        if(event.isTriggeredByTurn(globalTurn) || event.isTriggeredByRound(globalRound)) {
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
        this.lastRecentlyTriggered.push(id);

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