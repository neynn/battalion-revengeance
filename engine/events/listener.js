export const Listener = function(type) {
    this.id = type;
    this.nextID = 0;
    this.observers = [];
    this.singleObservers = [];
}

Listener.CODE = {
    SUPER: -1,
    ERROR: -2
};

Listener.OBSERVER_TYPE = {
    DEFAULT: 0,
    SINGLE: 1
};

Listener.prototype.getType = function(options) {
    if(!options) {
        return Listener.OBSERVER_TYPE.DEFAULT;
    }

    const { once } = options;

    if(once) {
        return Listener.OBSERVER_TYPE.SINGLE;
    }

    return Listener.OBSERVER_TYPE.DEFAULT;
}

Listener.prototype.getID = function(options) {
    if(!options) {
        return this.nextID++;
    }

    const { permanent, id } = options;

    if(permanent) {
        return Listener.CODE.SUPER;
    }

    if(id && typeof id !== "number") {
        return id;
    }

    return this.nextID++;
}

Listener.prototype.emit = function(argsList) {
    for(let i = 0; i < this.observers.length; i++) {
        this.observers[i].onCall(...argsList);
    }

    for(let i = 0; i < this.singleObservers.length; i++) {
        this.singleObservers[i].onCall(...argsList);
    }

    this.singleObservers.length = 0;
}

Listener.prototype.addObserver = function(type, id, onCall) {
    switch(type) {
        case Listener.OBSERVER_TYPE.SINGLE: {
            this.singleObservers.push({ "id": id, "onCall": onCall });
            break;
        }
        case Listener.OBSERVER_TYPE.DEFAULT: {
            this.observers.push({ "id": id, "onCall": onCall });
            break;
        }
        default: {
            console.warn(`Unknown observer type! ${type}`);
            break; 
        }
    }
}

Listener.prototype.getFilteredObservers = function(oldList, onCheck) {
    const observers = [];

    for(let i = 0; i < oldList.length; i++) {
        const observer = oldList[i];
        const result = onCheck(observer);

        if(result) {
            observers.push(observer);
        }
    }

    return observers;
}

Listener.prototype.filterObservers = function(onCheck) {
    if(typeof onCheck !== "function") {
        return;
    }

    if(this.observers.length > 0) {
        this.observers = this.getFilteredObservers(this.observers, onCheck);
    }

    if(this.singleObservers.length > 0) {    
        this.singleObservers = this.getFilteredObservers(this.singleObservers, onCheck);
    }
}