import { Objective } from "../objective.js";

export const ProtectObjective = function(targets) {
    Objective.call(this, "PROTECT");

    this.targets = targets;
    this.status = Objective.STATUS.IDLE;
}

ProtectObjective.prototype = Object.create(Objective.prototype);
ProtectObjective.prototype.constructor = ProtectObjective;

ProtectObjective.prototype.onEntityDeath = function(entity) {
    const { customID } = entity;

    for(const targetID of this.targets) {
        if(targetID === customID) {
            this.fail();
            break;
        }
    }
}