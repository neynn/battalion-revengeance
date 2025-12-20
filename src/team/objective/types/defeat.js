import { Objective } from "../objective.js";

export const DefeatObjective = function(targetID) {
    Objective.call(this, "DEFEAT");

    this.targetID = targetID;
}

DefeatObjective.prototype = Object.create(Objective.prototype);
DefeatObjective.prototype.constructor = DefeatObjective;

DefeatObjective.prototype.onEntityDeath = function(entity) {
    const { customID } = entity;

    if(this.targetID === customID) {
        this.succeed();
    }
}