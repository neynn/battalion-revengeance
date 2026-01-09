import { EventEmitter } from "../../events/eventEmitter.js";

export const TurnManager = function() {
    this.nextID = 0;
    this.actors = new Map();
    this.actorOrder = [];
    this.globalTurn = 0;
    this.currentActor = null;
    this.previousActor = null;

    this.events = new EventEmitter();
    this.events.register(TurnManager.EVENT.NEXT_TURN);
    this.events.register(TurnManager.EVENT.NEXT_ROUND);
    this.events.register(TurnManager.EVENT.ACTOR_CREATE);
    this.events.register(TurnManager.EVENT.ACTOR_DESTROY);
}

TurnManager.EVENT = {
    NEXT_TURN: "NEXT_TURN",
    NEXT_ROUND: "NEXT_ROUND",
    ACTOR_CREATE: "ACTOR_CREATE",
    ACTOR_DESTROY: "ACTOR_DESTROY"
};

TurnManager.prototype.exit = function() {
    this.events.muteAll();
    this.actors.clear();
    this.actorOrder.length = 0;
    this.nextID = 0;
    this.globalTurn = 0;
    this.currentActor = null;
    this.previousActor = null;
}

TurnManager.prototype.forAllActors = function(onCall) {
    if(typeof onCall === "function") {
        this.actors.forEach((actor) => onCall(actor));
    }
}

TurnManager.prototype.createActor = function(onCreate, externalID) {
    const actorID = externalID !== undefined ? externalID : this.nextID++;

    if(!this.actors.has(actorID)) {
        const actor = onCreate(actorID);

        if(actor) {
            this.actors.set(actorID, actor);
            this.events.emit(TurnManager.EVENT.ACTOR_CREATE, {
                "id": actorID,
                "actor": actor
            });

            return actor;
        }
    }

    return null;
}

//TODO: Destroy if current.
TurnManager.prototype.destroyActor = function(actorID) {
    if(this.actors.has(actorID)) {
        this.actors.delete(actorID);
        this.events.emit(TurnManager.EVENT.ACTOR_DESTROY, {
            "id": actorID
        });
    }
}

TurnManager.prototype.getActor = function(actorID) {
    const actor = this.actors.get(actorID);

    if(!actor) {
        return null;
    }

    return actor;
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
        this.events.emit(TurnManager.EVENT.NEXT_TURN, {
            "turn": this.globalTurn
        });
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

        if(this.actors.has(actorID)) {
            this.actorOrder.push(actorID);
        }
    }
}

TurnManager.prototype.update = function(gameContext) {
    for(const [actorID, actor] of this.actors) {
        actor.update(gameContext);
    }

    if(this.currentActor) {
        this.currentActor.activeUpdate(gameContext);
    }
}