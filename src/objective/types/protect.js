import { Objective } from "../objective.js";

export const ProtectObjective = function() {
    Objective.call(this);
}

ProtectObjective.prototype = Object.create(Objective.prototype);
ProtectObjective.prototype.constructor = ProtectObjective;

ProtectObjective.prototype.addTarget = function(config) {
    if(this.status !== Objective.STATUS.FAILURE) {
        this.status = Objective.STATUS.IDLE;
        this.createTarget(config.target);
    }
}

ProtectObjective.prototype.onDeath = function(gameContext, entity, teamID) {
    const { customID } = entity;

    for(const target of this.targets) {
        const { goal } = target;

        if(goal === customID) {
            this.fail();
            break;
        }
    } 
}