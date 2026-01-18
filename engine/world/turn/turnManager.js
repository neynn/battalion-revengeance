export const TurnManager = function() {
    this.nextID = 0;
    this.actors = [];
    this.actorOrder = [];
    this.globalTurn = 0;
    this.globalRound = 0;
    this.currentActor = null;
    this.previousActor = null;
}

TurnManager.prototype.exit = function() {
    this.nextID = 0;
    this.actors.length = 0;
    this.actorOrder.length = 0;
    this.globalTurn = 0;
    this.globalRound = 0;
    this.currentActor = null;
    this.previousActor = null;
}

TurnManager.prototype.forAllActors = function(onCall) {
    if(typeof onCall === "function") {
        for(let i = 0; i < this.actors.length; i++) {
            onCall(this.actors[i]);
        }
    }
}

TurnManager.prototype.getActorIndex = function(actorID) {
    for(let i = 0; i < this.actors.length; i++) {
        if(this.actors[i].getID() === actorID) {
            return i;
        }
    }

    return -1;
}

TurnManager.prototype.getNextID = function() {
    return this.nextID++;
}

TurnManager.prototype.addActor = function(actor) {
    const actorID = actor.getID();

    if(this.getActorIndex(actorID) === -1) {
        this.actors.push(actor);
    }
}

//TODO: Destroy if current.
TurnManager.prototype.destroyActor = function(actorID) {
    const index = this.getActorIndex(actorID);

    if(index !== -1) {
        this.actors[index] = this.actors[this.actors.length - 1];
        this.actors.pop();
    }
}

TurnManager.prototype.getActor = function(actorID) {
    const index = this.getActorIndex(actorID);

    if(index === -1) {
        return null;
    }

    return this.actors[index];
}

TurnManager.prototype.isActor = function(actorID) {
    if(this.currentActor === null) {
        return false;
    }

    return this.currentActor.getID() === actorID;
}

TurnManager.prototype.getNextActor = function() {
    if(this.actorOrder.length === 0 || this.currentActor !== null) {
        return null;
    }

    if(this.previousActor === null) {   
        return this.actorOrder[0];
    } else {
        const index = this.actorOrder.indexOf(this.previousActor);

        if(index !== -1) {
            const nextIndex = (index + 1) % this.actorOrder.length;
            const nextID = this.actorOrder[nextIndex];

            return nextID;
        }
    }

    return null;
}

TurnManager.prototype.setCurrentActor = function(gameContext, actorID) {
    const actor = this.getActor(actorID);

    if(actor) {
        this.globalTurn++;
        this.currentActor = actor;
        this.currentActor.startTurn(gameContext);
    }
}

TurnManager.prototype.clearCurrentActor = function(gameContext) {
    if(this.currentActor) {
        this.previousActor = this.currentActor.getID();
        this.currentActor.endTurn(gameContext);
        this.currentActor = null;
    }
}

TurnManager.prototype.setActorOrder = function(order) {
    this.currentActor = null;
    this.previousActor = null;
    this.actorOrder.length = 0;

    for(let i = 0; i < order.length; i++) {
        const actorID = order[i];
        const index = this.getActorIndex(actorID);

        if(index !== -1) {
            this.actorOrder.push(actorID);
        }
    }
}

TurnManager.prototype.update = function(gameContext) {
    for(let i = 0; i < this.actors.length; i++) {
        this.actors[i].update(gameContext);
    }

    if(this.currentActor) {
        this.currentActor.activeUpdate(gameContext);
    }
}