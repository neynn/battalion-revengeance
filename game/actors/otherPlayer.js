import { Actor } from "../../engine/turn/actor.js";

export const OtherPlayer = function(id) {
    Actor.call(this, id);
}

OtherPlayer.prototype = Object.create(Actor.prototype);
OtherPlayer.prototype.constructor = OtherPlayer;