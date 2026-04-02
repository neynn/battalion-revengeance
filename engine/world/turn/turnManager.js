export const TurnManager = function() {
    this.nextID = 0;
    this.actors = [];
    this.currentActor = null;
}

TurnManager.prototype.exit = function() {
    this.nextID = 0;
    this.actors.length = 0;
    this.currentActor = null;
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

//TODO(neyn): Destroy if current.
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

TurnManager.prototype.setCurrentActor = function(gameContext, actorID) {
    const actor = this.getActor(actorID);

    if(actor) {
        this.currentActor = actor;
        this.currentActor.startTurn(gameContext);
    }
}

TurnManager.prototype.clearCurrentActor = function(gameContext) {
    if(this.currentActor) {
        this.currentActor.endTurn(gameContext);
        this.currentActor = null;
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