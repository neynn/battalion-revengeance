import { Actor } from "../../engine/turn/actor.js";

export const BattalionActor = function(id) {
    Actor.call(this, id);

    this.entities = [];
}

BattalionActor.prototype = Object.create(Actor.prototype);
BattalionActor.prototype.constructor = BattalionActor;

BattalionActor.prototype.addEntity = function(entityID) {
    if(!this.hasEntity(entityID)) {
        this.entities.push(entityID);
    }
}

BattalionActor.prototype.removeEntity = function(entityID) {
    for(let i = 0; i < this.entities.length; i++) {
        if(this.entities[i] === entityID) {
            this.entities[i] = this.entities[this.entities.length - 1];
            this.entities.pop();
            return;
        }
    }
}

BattalionActor.prototype.hasEntity = function(entityID) {
    for(let i = 0; i < this.entities.length; i++) {
        if(this.entities[i] === entityID) {
            return true;
        }
    }

    return false;
}