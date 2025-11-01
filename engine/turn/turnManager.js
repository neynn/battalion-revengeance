import { EventEmitter } from "../events/eventEmitter.js";
import { Logger } from "../logger.js";

export const TurnManager = function() {
    this.nextID = 0;
    this.actorTypes = {};
    this.actors = new Map();
    this.actorOrder = [];
    this.actorIndex = -1;
    this.actionsLeft = 0;
    this.currentRound = 1;
    this.currentTurn = 0;

    this.events = new EventEmitter();
    this.events.register(TurnManager.EVENT.NEXT_TURN);
    this.events.register(TurnManager.EVENT.NEXT_ROUND);
    this.events.register(TurnManager.EVENT.ACTOR_CREATE);
    this.events.register(TurnManager.EVENT.ACTOR_DESTROY);
    this.events.register(TurnManager.EVENT.ACTOR_CHANGE);
    this.events.register(TurnManager.EVENT.ACTIONS_REDUCE);
    this.events.register(TurnManager.EVENT.ACTIONS_CLEAR);
}

TurnManager.EVENT = {
    NEXT_TURN: "NEXT_TURN",
    NEXT_ROUND: "NEXT_ROUND",
    ACTOR_CREATE: "ACTOR_CREATE",
    ACTOR_DESTROY: "ACTOR_DESTROY",
    ACTOR_CHANGE: "ACTOR_CHANGE",
    ACTIONS_REDUCE: "ACTIONS_REDUCE",
    ACTIONS_CLEAR: "ACTIONS_CLEAR"
};

TurnManager.prototype.getGlobalTurn = function() {
    return this.currentTurn;
}

TurnManager.prototype.getGlobalRound = function() {
    return this.currentRound;
}

TurnManager.prototype.load = function(actorTypes) {
    if(actorTypes) {
        this.actorTypes = actorTypes;
    }
}

TurnManager.prototype.getActorType = function(typeID) {
    const actorType = this.actorTypes[typeID];

    if(!actorType) {
        return null;
    }

    return actorType;
}

TurnManager.prototype.exit = function() {
    this.events.muteAll();
    this.actors.clear();
    this.actorOrder.length = 0;
    this.actorIndex = -1;
    this.actionsLeft = 0;
    this.nextID = 0;
    this.currentRound = 1;
    this.currentTurn = 0;
}

TurnManager.prototype.forAllActors = function(onCall) {
    if(typeof onCall === "function") {
        this.actors.forEach((actor) => onCall(actor));
    }
}

TurnManager.prototype.createActor = function(onCreate, typeID, externalID) {
    const actorID = externalID !== undefined ? externalID : this.nextID++;

    if(!this.actors.has(actorID)) {
        const actorType = this.getActorType(typeID);

        if(actorType) {
            const actor = onCreate(actorID, actorType);

            if(actor) {
                this.actors.set(actorID, actor);
                this.events.emit(TurnManager.EVENT.ACTOR_CREATE, actorID, actor);

                return actor;
            }
        }
    }

    return null;
}

TurnManager.prototype.destroyActor = function(actorID) {
    if(!this.actors.has(actorID)) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Actor does not exist!", "TurnManager.prototype.removeActor", { "actorID": actorID });
        return;
    }

    this.actors.delete(actorID);
    this.events.emit(TurnManager.EVENT.ACTOR_DESTROY, actorID);
}

TurnManager.prototype.getActor = function(actorID) {
    const actor = this.actors.get(actorID);

    if(!actor) {
        return null;
    }

    return actor;
}

TurnManager.prototype.isActor = function(actorID) {
    if(this.actorIndex !== -1) {
        const currentActorID = this.actorOrder[this.actorIndex];
        const isActor = actorID === currentActorID;

        return isActor;
    }

    return false;
}

TurnManager.prototype.startNextTurn = function() {
    this.actorIndex++;
    this.currentTurn++;
    this.events.emit(TurnManager.EVENT.NEXT_TURN, this.currentTurn);

    if(this.actorIndex === this.actorOrder.length) {
        this.actorIndex = 0;
        this.currentRound++;
        this.events.emit(TurnManager.EVENT.NEXT_ROUND, this.currentRound);
    }
}

TurnManager.prototype.getNextActor = function(gameContext) {
    if(this.actorOrder.length === 0) {
        return null;
    }

    if(this.actorIndex === -1) {
        this.startNextTurn();

        const firstActorID = this.actorOrder[this.actorIndex];
        const firstActor = this.actors.get(firstActorID);
        
        firstActor.startTurn(gameContext);   

        this.actionsLeft = firstActor.maxActions;

        return firstActor;
    }

    const currentActorID = this.actorOrder[this.actorIndex];
    const currentActor = this.actors.get(currentActorID);

    if(this.actionsLeft > 0) {
        return currentActor;
    }

    currentActor.endTurn(gameContext);
    this.startNextTurn();

    const actorID = this.actorOrder[this.actorIndex];
    const actor = this.actors.get(actorID);

    actor.startTurn(gameContext);   

    this.actionsLeft = actor.maxActions;
    this.events.emit(TurnManager.EVENT.ACTOR_CHANGE, currentActorID, actorID);

    return actor;
}

TurnManager.prototype.getCurrentActor = function() {
    if(this.actorIndex !== -1) {
        const currentActorID = this.actorOrder[this.actorIndex];
        const currentActor = this.actors.get(currentActorID);

        return currentActor;
    }

    return null;
}

TurnManager.prototype.cancelActorActions = function() {
    const currentActor = this.getCurrentActor();

    if(currentActor) {
        this.actionsLeft = 0;
        this.events.emit(TurnManager.EVENT.ACTIONS_CLEAR, currentActor, this.actionsLeft);
    }
}

TurnManager.prototype.reduceActorActions = function(value) {
    const currentActor = this.getCurrentActor();

    if(currentActor) {
        this.actionsLeft -= value;

        if(this.actionsLeft < 0) {
            this.actionsLeft = 0;
        }

        this.events.emit(TurnManager.EVENT.ACTIONS_REDUCE, currentActor, this.actionsLeft);
    }
}

TurnManager.prototype.removeFromOrder = function(actorID) {
    //TODO: Implement.
    //Changes the actorOrder and decrements the actorIndex if actorIndex >= index of actorID!
}

TurnManager.prototype.setActorOrder = function(order) {
    this.actorIndex = -1;
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

    const actor = this.getNextActor(gameContext);

    if(actor) {
        actor.activeUpdate(gameContext, this.actionsLeft);

        if(actor.endRequested) {
            this.actionsLeft = 0;
        }
    }
}