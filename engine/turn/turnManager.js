import { EventEmitter } from "../events/eventEmitter.js";
import { Logger } from "../logger.js";

export const TurnManager = function() {
    this.actorTypes = {};
    this.actors = new Map();
    this.actorOrder = [];
    this.actorIndex = -1;
    this.actionsLeft = 0;

    this.events = new EventEmitter();
    this.events.listen(TurnManager.EVENT.ACTOR_ADD);
    this.events.listen(TurnManager.EVENT.ACTOR_REMOVE);
    this.events.listen(TurnManager.EVENT.ACTOR_CHANGE);
    this.events.listen(TurnManager.EVENT.ACTIONS_REDUCE);
    this.events.listen(TurnManager.EVENT.ACTIONS_CLEAR);
}

TurnManager.EVENT = {
    ACTOR_ADD: "ACTOR_ADD",
    ACTOR_REMOVE: "ACTOR_REMOVE",
    ACTOR_CHANGE: "ACTOR_CHANGE",
    ACTIONS_REDUCE: "ACTIONS_REDUCE",
    ACTIONS_CLEAR: "ACTIONS_CLEAR"
};

TurnManager.prototype.load = function(actorTypes) {
    if(actorTypes) {
        this.actorTypes = actorTypes;
    }
}

TurnManager.prototype.exit = function() {
    this.events.muteAll();
    this.actors.clear();
    this.actorOrder.length = 0;
    this.actorIndex = -1;
    this.actionsLeft = 0;
}

TurnManager.prototype.getActorType = function(typeID) {
    const actorType = this.actorTypes[typeID];

    if(!actorType) {
        return null;
    }

    return actorType;
}

TurnManager.prototype.forAllActors = function(onCall) {
    if(typeof onCall === "function") {
        this.actors.forEach((actor) => onCall(actor));
    }
}

TurnManager.prototype.addActor = function(actorID, actor) {
    if(this.actors.has(actorID)) {
        Logger.log(Logger.CODE.ENGINE_WARN, "ActorID is already taken!", "TurnManager.prototype.addActor", { "actorID": actorID });
        return;
    }

    this.actors.set(actorID, actor);
    this.events.emit(TurnManager.EVENT.ACTOR_ADD, actorID, actor);
}

TurnManager.prototype.removeActor = function(actorID) {
    if(!this.actors.has(actorID)) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Actor does not exist!", "TurnManager.prototype.removeActor", { "actorID": actorID });
        return;
    }

    this.actors.delete(actorID);
    this.events.emit(TurnManager.EVENT.ACTOR_REMOVE, actorID);
}

TurnManager.prototype.getActor = function(actorID) {
    const actor = this.actors.get(actorID);

    if(!actor) {
        return null;
    }

    return actor;
}

TurnManager.prototype.isActor = function(actorID) {
    if(this.actorIndex === -1) {
        return false;
    }

    const currentActorID = this.actorOrder[this.actorIndex];
    const isActor = actorID === currentActorID;

    return isActor;
}

TurnManager.prototype.getNextActor = function(gameContext) {
    if(this.actorOrder.length === 0) {
        return null;
    }

    if(this.actorIndex === -1) {
        this.actorIndex++;

        const firstActorID = this.actorOrder[this.actorIndex];
        const firstActor = this.actors.get(firstActorID);
        
        firstActor.onTurnStart(gameContext);   

        this.actionsLeft = firstActor.maxActions;

        return firstActor;
    }

    const currentActorID = this.actorOrder[this.actorIndex];
    const currentActor = this.actors.get(currentActorID);

    if(this.actionsLeft > 0) {
        return currentActor;
    }

    this.actorIndex++;
    this.actorIndex %= this.actorOrder.length;

    const actorID = this.actorOrder[this.actorIndex];
    const actor = this.actors.get(actorID);

    currentActor.onTurnEnd(gameContext);
    actor.onTurnStart(gameContext);   

    this.actionsLeft = actor.maxActions;
    this.events.emit(TurnManager.EVENT.ACTOR_CHANGE, currentActorID, actorID);

    return actor;
}

TurnManager.prototype.getCurrentActor = function() {
    if(this.actorIndex === -1) {
        return null;
    }

    const currentActorID = this.actorOrder[this.actorIndex];
    const currentActor = this.actors.get(currentActorID);

    return currentActor;
}

TurnManager.prototype.cancelActorActions = function() {
    const currentActor = this.getCurrentActor();

    if(!currentActor) {
        return;
    }

    this.actionsLeft = 0;
    this.events.emit(TurnManager.EVENT.ACTIONS_CLEAR, currentActor, this.actionsLeft);
}

TurnManager.prototype.reduceActorActions = function(value) {
    const currentActor = this.getCurrentActor();

    if(!currentActor) {
        return;
    }

    this.actionsLeft -= value;

    if(this.actionsLeft < 0) {
        this.actionsLeft = 0;
    }

    this.events.emit(TurnManager.EVENT.ACTIONS_REDUCE, currentActor, this.actionsLeft);
}

TurnManager.prototype.setActorOrder = function(gameContext, order, index = -1) {
    if(order.length === 0) {
        return false;
    }

    for(let i = 0; i < order.length; i++) {
        const actorID = order[i];

        if(!this.actors.has(actorID)) {
            return false;
        }
    }

    if(index >= order.length) {
        return false;
    }

    this.actorOrder = order;
    this.actorIndex = index;

    const currentActor = this.getCurrentActor();

    if(currentActor) {
        this.actionsLeft = currentActor.maxActions;

        currentActor.onTurnStart(gameContext);
    }

    return true;
}

TurnManager.prototype.update = function(gameContext) {
    const { world } = gameContext;
    const { actionQueue } = world;

    this.actors.forEach(actor => actor.update(gameContext));

    const isQueueRunning = actionQueue.isRunning();

    if(isQueueRunning) {
        return;
    }

    const actor = this.getNextActor(gameContext);

    if(actor && this.actionsLeft > 0) {
        actor.onMakeChoice(gameContext, this.actionsLeft);
    }
}

TurnManager.prototype.removeEntity = function(entityID) {
    this.actors.forEach((actor) => {
        actor.removeEntity(entityID);
    });
}

TurnManager.prototype.addEntity = function(actorID, entityID) {
    const owner = this.actors.get(actorID);

    if(!owner) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Actor does not exist!", "TurnManager.prototype.addEntity", { "actorID": actorID });
        return;
    }

    owner.addEntity(entityID);
}

TurnManager.prototype.getOwnersOf = function(entityID) {
    const owners = [];

    this.actors.forEach((actor) => {
        if(actor.hasEntity(entityID)) {
            owners.push(actor);
        }
    });

    return owners;
}