export const ActionState = function() {}

ActionState.prototype.onStart = function(gameContext, executionData) {}
ActionState.prototype.onEnd = function(gameContext, executionData) {}
ActionState.prototype.onUpdate = function(gameContext, executionData) {}
ActionState.prototype.isFinished = function(gameContext, executionPlan) {
    return true;
}