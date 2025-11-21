export const Listener = function(type) {
    this.id = type;
    this.nextID = 0;
    this.observers = [];
    this.singleObservers = [];
}

Listener.ID = {
    SUPER: -1,
    ERROR: -2
};

Listener.OBSERVER_TYPE = {
    DEFAULT: 0,
    SINGLE: 1
};

Listener.prototype.getType = function(options) {
    if(options) {
        const { once } = options;

        if(once) {
            return Listener.OBSERVER_TYPE.SINGLE;
        }
    }

    return Listener.OBSERVER_TYPE.DEFAULT;
}

Listener.prototype.getID = function(options) {
    if(options) {
        const { permanent, id } = options;

        if(permanent) {
            return Listener.ID.SUPER;
        }

        if(id && typeof id !== "number") {
            return id;
        }
    }

    return this.nextID++;
}

Listener.prototype.emit = function(event) {
    for(let i = 0; i < this.observers.length; i++) {
        this.observers[i].onEvent(event);
    }

    for(let i = 0; i < this.singleObservers.length; i++) {
        this.singleObservers[i].onEvent(event);
    }

    this.singleObservers.length = 0;
}

Listener.prototype.addObserver = function(onEvent, options) {
    const observerType = this.getType(options);
    const observerID = this.getID(options);

    switch(observerType) {
        case Listener.OBSERVER_TYPE.SINGLE: {
            this.singleObservers.push({
                "id": observerID,
                "onEvent": onEvent
            });

            return observerID;
        }
        case Listener.OBSERVER_TYPE.DEFAULT: {
            this.observers.push({
                "id": observerID,
                "onEvent": onEvent
            });

            return observerID;
        }
        default: {
            console.warn(`Unknown observer type! ${observerType}`);

            return Listener.ID.ERROR;
        }
    }
}

Listener.prototype.removeObservers = function(onCheck) {
    for(let i = this.observers.length - 1; i >= 0; i--) {
        const isRemoved = onCheck(this.observers[i]);

        if(isRemoved) {
            this.observers[i] = this.observers[this.observers.length - 1];
            this.observers.pop();
        }
    }

    for(let i = this.singleObservers.length - 1; i >= 0; i--) {
        const isRemoved = onCheck(this.singleObservers[i]);

        if(isRemoved) {
            this.singleObservers[i] = this.singleObservers[this.singleObservers.length - 1];
            this.singleObservers.pop();
        }
    }
}