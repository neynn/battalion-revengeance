export const Action = function() {}

Action.prototype.onStart = function(gameContext, executionData) {}
Action.prototype.onEnd = function(gameContext, executionData) {}
Action.prototype.onUpdate = function(gameContext, executionData) {}
Action.prototype.isFinished = function(gameContext, executionPlan) {
    return true;
}