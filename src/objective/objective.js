import { Target } from "./target.js";

export const Objective = function() {
    this.targets = [];
    this.status = Objective.STATUS.IDLE;
}

Objective.STATUS = {
    IDLE: 0,
    SUCCESS: 1,
    FAILURE: 2
};

Objective.prototype.allTargetsComplete = function() {
    for(let i = 0; i < this.targets.length; i++) {
        if(this.targets[i].status === Target.STATUS.INCOMPLETE) {
            return false;
        }
    }

    return true;
}

Objective.prototype.createTarget = function(config) {
    this.targets.push(new Target(config));

    return this.targets[this.targets.length - 1];
}

Objective.prototype.fail = function() {
    if(this.status === Objective.STATUS.IDLE) {
        this.status = Objective.STATUS.FAILURE;
    }
}

Objective.prototype.succeed = function() {
    if(this.status === Objective.STATUS.IDLE) {
        this.status = Objective.STATUS.SUCCESS;
    }
}

Objective.prototype.addTarget = function(config) {}
Objective.prototype.onTurnEnd = function(gameContext, currentTurn, teamID) {}
Objective.prototype.onMove = function(gameContext, entity, teamID) {}
Objective.prototype.onDeath = function(gameContext, entity, teamID) {}