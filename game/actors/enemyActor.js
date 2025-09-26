import { Actor } from "../../engine/turn/actor.js";
import { ArmyEventHandler } from "../armyEventHandler.js";
import { ActionRequestEvent } from "../events/actionRequest.js";

export const EnemyActor = function(id) {
    Actor.call(this, id);

    this.teamID = null;
}

EnemyActor.prototype = Object.create(Actor.prototype);
EnemyActor.prototype.constructor = EnemyActor;

EnemyActor.prototype.activeUpdate = function(gameContext, actionsLeft) {
    const { world } = gameContext;
    const { eventBus } = world;

    eventBus.emit(ArmyEventHandler.TYPE.ACTION_REQUEST, ActionRequestEvent.createEvent(this.id));
}