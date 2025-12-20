import { Objective } from "../objective.js";

export const TimeLimitObjective = function(turn) {
    Objective.call(this, "TIME_LIMIT");

    this.turn = turn;
    this.status = Objective.STATUS.IDLE;
}

TimeLimitObjective.prototype = Object.create(Objective.prototype);
TimeLimitObjective.prototype.constructor = TimeLimitObjective;

TimeLimitObjective.prototype.onTurnEnd = function(currentTurn) {
    if(currentTurn >= this.turn) {
        this.fail();
    }
}