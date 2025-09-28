export const Target = function(config) {
    this.status = Target.STATUS.INCOMPLETE;
    this.config = config;
}

Target.STATUS = {
    INCOMPLETE: 0,
    COMPLETE: 1
};

Target.prototype.complete = function() {
    this.status = Target.STATUS.COMPLETE;
}

Target.prototype.incomplete = function() {
    this.status = Target.STATUS.INCOMPLETE;
}