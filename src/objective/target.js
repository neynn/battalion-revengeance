export const Target = function(goal) {
    this.status = Target.STATUS.INCOMPLETE;
    this.goal = goal;
}

Target.STATUS = {
    INCOMPLETE: 0,
    COMPLETE: 1
};

Target.prototype.toComplete = function() {
    this.status = Target.STATUS.COMPLETE;
}

Target.prototype.toIncomplete = function() {
    this.status = Target.STATUS.INCOMPLETE;
}