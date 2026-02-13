export const Objective = function(DEBUG_NAME) {
    this.DEBUG_NAME = DEBUG_NAME;
    this.status = Objective.STATUS.ACTIVE;
    this.modifiers = [];
}

Objective.STATUS = {
    IDLE: 0,
    ACTIVE: 1,
    SUCCESS: 2,
    FAILURE: 3
};

Objective.prototype.addModifier = function(modifier) {
    this.modifiers.push(modifier);
}

Objective.prototype.fail = function() {
    this.status = Objective.STATUS.FAILURE;
}

Objective.prototype.succeed = function() {
    this.status = Objective.STATUS.SUCCESS;
}

Objective.prototype.onEntityDeath = function(entity) {}
Objective.prototype.onTurnEnd = function(gameContext, turn, teamID) {} 