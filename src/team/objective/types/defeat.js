import { Objective } from "../objective.js";

export const DefeatObjective = function() {
    Objective.call(this, "DEFEAT");
}

DefeatObjective.prototype = Object.create(Objective.prototype);
DefeatObjective.prototype.constructor = DefeatObjective;

DefeatObjective.prototype.addTarget = function(config) {
    this.status = Objective.STATUS.IDLE;
    this.createTarget(config.target);
}

DefeatObjective.prototype.onDeath = function(entity) {
    const { customID } = entity;

    for(const target of this.targets) {
        const { goal } = target;

        if(goal === customID) {
            target.toComplete();
        }
    }

    if(this.allTargetsComplete()) {
        this.succeed();
    }
}