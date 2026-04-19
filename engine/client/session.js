import { ActorManager } from "../world/actor/actorManager.js";

export const Session = function() {
    this.actorID = ActorManager.INVALID_ID;
}

Session.prototype.exit = function() {
    this.actorID = ActorManager.INVALID_ID;
}