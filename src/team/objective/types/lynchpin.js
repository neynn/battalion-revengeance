import { Objective } from "../objective.js";

export const LynchpinObjective = function() {
    Objective.call(this, "LYNCHPIN");

    this.lynchpins = [];
    this.hasLynchpin = false;
    this.status = Objective.STATUS.IDLE;
}

LynchpinObjective.prototype = Object.create(Objective.prototype);
LynchpinObjective.prototype.constructor = LynchpinObjective;

LynchpinObjective.prototype.addLynchpin = function(entityID) {
    this.lynchpins.push(entityID);
    this.hasLynchpin = true;
}

LynchpinObjective.prototype.onEntityDeath = function(entity) {
    const entityID = entity.getID();

    for(let i = 0; i < this.lynchpins.length; i++) {
        if(this.lynchpins[i] === entityID) {
            this.lynchpins[i] = this.lynchpins[this.lynchpins.length - 1];
            this.lynchpins.pop();
            break;
        }
    }

    if(this.hasLynchpin && this.lynchpins.length === 0) {
        this.fail();
    }
}