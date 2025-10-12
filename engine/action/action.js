export const Action = function() {
    this.priority = Action.PRIORITY.LOW;
    this.isSendable = false;
    this.isReceiveable = false;
}

Action.PRIORITY = {
    NONE: 0,
    LOW: 1,
    NORMAL: 2,
    HIGH: 3
};

Action.prototype.onValid = function(gameContext) {}
Action.prototype.onInvalid = function(gameContext) {}
Action.prototype.onStart = function(gameContext, actionData, requestID) {}
Action.prototype.onEnd = function(gameContext, actionData, requestID) {}
Action.prototype.onUpdate = function(gameContext, actionData, requestID) {}
Action.prototype.isFinished = function(gameContext, executionRequest) {}
Action.prototype.validate = function(gameContext, executionRequest, data) {}