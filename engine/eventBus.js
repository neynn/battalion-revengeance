export const EventBus = function() {
    this.emitable = {};
    this.handlers = [];
    this.postEvents = [];
}

EventBus.EVENT_TYPE = {
    DIRECT: 0,
    POST: 1
};

EventBus.prototype.setEmitableTable = function(table) {
    if(typeof table === "object") {
        this.emitable = table;
    }
}

EventBus.prototype.clear = function() {
    this.emitable = {};
    this.handlers = [];
    this.postEvents = [];
}

EventBus.prototype.onAnyEvent = function(handler) {
    if(typeof handler === "function") {
        this.handlers.push(handler);
    }
}

EventBus.prototype.isEmitable = function(eventID) {
    const status = this.emitable[eventID];
    const isEmitable = status != 0;

    return isEmitable;
}

EventBus.prototype.addPostEvent = function(actionID, eventID, eventData) {
    this.postEvents.push({
        "actionID": actionID,
        "eventID": eventID,
        "eventData": eventData
    });
}

EventBus.prototype.onExecutionComplete = function(executionItem) {
    const completedEvents = [];

    for(let i = 0; i < this.postEvents.length; i++) {
        const event = this.postEvents[i];
        const { actionID, eventID, eventData } = event;

        if(actionID <= executionItem.id) {
            const actionsBehind = executionItem.id - actionID;

            this.force(eventID, eventData);

            completedEvents.push(i);
        }
    }

    for(let i = completedEvents.length - 1; i >= 0; i--) {
        const eventIndex = completedEvents[i];

        this.postEvents.splice(eventIndex, 1);
    }
}

EventBus.prototype.force = function(eventID, eventData) {
    for(let i = 0; i < this.handlers.length; i++) {
        this.handlers[i](eventID, eventData);
    }
}

EventBus.prototype.emit = function(eventID, eventData) {
    if(this.isEmitable(eventID)) {
        for(let i = 0; i < this.handlers.length; i++) {
            this.handlers[i](eventID, eventData);
        }
    }
}