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

Objective.prototype.hasAnyTarget = function() {
    return this.targets.length !== 0;
}

Objective.prototype.allTargetsIncomplete = function() {
    for(let i = 0; i < this.targets.length; i++) {
        if(this.targets[i].status === Target.STATUS.COMPLETE) {
            return false;
        }
    }

    return true;
}

Objective.prototype.allTargetsComplete = function() {
    for(let i = 0; i < this.targets.length; i++) {
        if(this.targets[i].status === Target.STATUS.INCOMPLETE) {
            return false;
        }
    }

    return true;
}

Objective.prototype.createTarget = function(goal) {
    this.targets.push(new Target(goal));

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