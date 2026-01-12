import { BattalionActor } from "./battalionActor.js";

export const MPBattalionActor = function(id) {
    BattalionActor.call(this, id);

    this.clientID = null;
}

MPBattalionActor.prototype = Object.create(BattalionActor.prototype);
MPBattalionActor.prototype.constructor = MPBattalionActor;