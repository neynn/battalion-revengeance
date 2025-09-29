import { Objective } from "../objective.js";

export const TimeLimitObjective = function() {
    Objective.call(this);
}

TimeLimitObjective.prototype = Object.create(Objective.prototype);
TimeLimitObjective.prototype.constructor = TimeLimitObjective;

TimeLimitObjective.prototype.addTarget = function(config) {
    if(this.status !== Objective.STATUS.FAILURE) {
        this.createTarget({
            "turn": config.turn
        });
    }
}

TimeLimitObjective.prototype.onTurnEnd = function(gameContext, currentTurn, teamID) {
    for(const target of this.targets) {
        const { config } = target;
        const { turn } = config;

        if(currentTurn >= turn) {
            this.fail();
            break;
        }
    }
}