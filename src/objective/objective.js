export const Objective = function() {
    this.status = Objective.STATUS.IDLE;
}

Objective.STATUS = {
    IDLE: 0,
    SUCCESS: 1,
    FAILURE: 2
};

Objective.prototype.fail = function() {
    this.status = Objective.STATUS.FAILURE;
}

Objective.prototype.succeed = function() {
    this.status = Objective.STATUS.SUCCESS;
}