import { Objective } from "../objective.js";

export const SurviveObjective = function() {
    Objective.call(this);
}

SurviveObjective.prototype = Object.create(Objective.prototype);
SurviveObjective.prototype.constructor = SurviveObjective;

SurviveObjective.prototype.addTarget = function(config) {
    if(this.status !== Objective.STATUS.FAILURE) {
        this.status = Objective.STATUS.IDLE;
        this.createTarget(config.turn);
    }
}

SurviveObjective.prototype.onTurnEnd = function(gameContext, currentTurn, teamID) {
    for(const target of this.targets) {
        const { goal } = target;

        if(currentTurn >= goal) {
            target.toComplete();
        }
    }

    if(this.allTargetsComplete()) {
        this.succeed();
    }
}