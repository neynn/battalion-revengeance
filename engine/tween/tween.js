export const Tween = function() {
    this.waitType = Tween.WAIT_TYPE.PARALLEL;
    this.state = Tween.STATE.RUNNING;
    this.timePassed = 0;
}

Tween.STATE = {
    RUNNING: 0,
    COMPLETE: 1
};

Tween.WAIT_TYPE = {
    PARALLEL: 0, //Always runs.
    SEQUENTIAL: 1, //Runs only if no SEQUENTIAL or SEQUENTIAL_ALL has run.
    SEQUENTIAL_ALL: 2  //Always runs but blocks the next SEQUENTIAL.
};

Tween.prototype.update = function(gameContext) {}