import { Objective } from "../objective.js";

export const SurviveObjective = function(turn) {
    Objective.call(this, "SURVIVE");

    this.turn = turn;
}

SurviveObjective.prototype = Object.create(Objective.prototype);
SurviveObjective.prototype.constructor = SurviveObjective;

SurviveObjective.prototype.onTurnEnd = function(currentTurn) {
    if(currentTurn >= this.turn) {
        this.succeed();
    }
}