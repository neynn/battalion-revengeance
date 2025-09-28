import { Objective } from "../objective.js";

export const DefeatObjective = function() {
    Objective.call(this);
}

DefeatObjective.prototype = Object.create(Objective.prototype);
DefeatObjective.prototype.constructor = DefeatObjective;

DefeatObjective.prototype.addTarget = function(config) {
    this.status = Objective.STATUS.IDLE;
    this.createTarget({
        "name": config.target
    });
}

DefeatObjective.prototype.onDeath = function(gameContext, entity, teamID) {
    const { customID } = entity;

    for(const target of this.targets) {
        const { config } = target;
        const { name } = config;

        if(name === customID) {
            target.complete();
        }
    }

    if(this.allTargetsComplete()) {
        this.succeed();
    }
}