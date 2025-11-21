import { Listener } from "./listener.js";

export const EventEmitter = function() {
    this.listeners = new Map();
}

EventEmitter.prototype.register = function(eventType) {
    if(!this.listeners.has(eventType)) {
        const listener = new Listener(eventType);

        this.listeners.set(eventType, listener);
    }
}

EventEmitter.prototype.remove = function(eventType) {
    if(this.listeners.has(eventType)) {
        this.listeners.delete(eventType);
    }
}

EventEmitter.prototype.removeAll = function() {
    this.listeners.clear();
}

EventEmitter.prototype.on = function(eventType, onCall, options) {
    const listener = this.listeners.get(eventType);

    if(!listener) {
        return Listener.ID.ERROR;
    }

    if(typeof onCall !== "function") {
        console.warn("onCall must be a function!");
        return Listener.ID.ERROR;
    }

    return listener.addObserver(onCall, options);
}

EventEmitter.prototype.unsubscribe = function(eventType, subscriberID) {
    if(subscriberID !== Listener.ID.SUPER) {
        const listener = this.listeners.get(eventType);

        if(listener) {
            listener.removeObservers(o => o.id === subscriberID);
        }
    }
}

EventEmitter.prototype.unsubscribeAll = function(subscriberID) {
    if(subscriberID !== Listener.ID.SUPER) {
        for(const [listenerID, listener] of this.listeners) {
            listener.removeObservers(o => o.id === subscriberID);
        }
    }
}

EventEmitter.prototype.mute = function(eventType) {
    const listener = this.listeners.get(eventType);

    if(listener) {
        listener.removeObservers(o => o.id !== Listener.ID.SUPER);
    }
}

EventEmitter.prototype.muteAll = function() {
    for(const [listenerID, listener] of this.listeners) {
        listener.removeObservers(o => o.id !== Listener.ID.SUPER);
    }
}

EventEmitter.prototype.emit = function(eventType, event) {
    const listener = this.listeners.get(eventType);

    if(listener) {
        listener.emit(event);
    }
}