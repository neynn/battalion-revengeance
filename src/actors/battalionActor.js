import { Actor } from "../../engine/turn/actor.js";
import { TypeRegistry } from "../typeRegistry.js";

export const BattalionActor = function(id) {
    Actor.call(this, id);

    this.entities = [];
    this.colorID = null;
    this.customColor = null;
}

BattalionActor.prototype = Object.create(Actor.prototype);
BattalionActor.prototype.constructor = BattalionActor;

BattalionActor.prototype.setCustomColor = function(color) {
    this.colorID = "CUSTOM_" + this.id;
    this.customColor = color;
}

BattalionActor.prototype.setColor = function(colorID) {
    this.colorID = colorID;
    this.customColor = null;
}

BattalionActor.prototype.getColorSchema = function(gameContext) {
    const { typeRegistry } = gameContext;
    const color = this.customColor ? this.customColor : typeRegistry.getType(this.colorID, TypeRegistry.CATEGORY.SCHEMA);

    return {
        "colorID": this.colorID,
        "color": color
    }
}

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