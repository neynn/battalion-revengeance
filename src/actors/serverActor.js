import { BattalionActor } from "./battalionActor.js";

export const ServerActor = function(id) {
    BattalionActor.call(this, id);

    this.clientID = null;
}

ServerActor.prototype = Object.create(BattalionActor.prototype);
ServerActor.prototype.constructor = ServerActor;