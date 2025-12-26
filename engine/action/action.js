export const Action = function() {
    this.priority = Action.PRIORITY.LOW;
}

Action.PRIORITY = {
    NONE: 0,
    LOW: 1,
    NORMAL: 2,
    HIGH: 3
};

Action.prototype.onValid = function(gameContext) {}
Action.prototype.onInvalid = function(gameContext) {}
Action.prototype.onStart = function(gameContext, executionData) {}
Action.prototype.onEnd = function(gameContext, executionData) {}
Action.prototype.onUpdate = function(gameContext, executionData) {}
Action.prototype.isFinished = function(gameContext, executionPlan) {}
Action.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {}