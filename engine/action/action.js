export const Action = function() {}

Action.prototype.execute = function(gameContext, data) {}
Action.prototype.onStart = function(gameContext, executionData) {}
Action.prototype.onEnd = function(gameContext, executionData) {}
Action.prototype.onUpdate = function(gameContext, executionData) {}
Action.prototype.isFinished = function(gameContext, executionPlan) {}
Action.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {}