export const ActionRouter = function() {
    this.sendable = new Set();
    this.receivable = new Set();
}

ActionRouter.prototype.dispatch = function(gameContext, executionPlan) {}
ActionRouter.prototype.forceEnqueue = function(gameContext, actionIntent) {}