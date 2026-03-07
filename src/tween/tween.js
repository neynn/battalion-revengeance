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
    PARALLEL: 0,
    SEQUENTIAL: 1
};

Tween.prototype.update = function(gameContext) {}