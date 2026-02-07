export const ActionRouter = function() {
    this.target = ActionRouter.TARGET.SELF;
}

ActionRouter.TARGET = {
    SELF: 0,
    OTHER: 1
};

ActionRouter.prototype.dispatch = function(gameContext, executionPlan, actionIntent) {}
ActionRouter.prototype.forceEnqueue = function(gameContext, actionIntent) {}

ActionRouter.prototype.toSelf = function() {
    this.target = ActionRouter.TARGET.SELF;
}

ActionRouter.prototype.toOther = function() {
    this.target = ActionRouter.TARGET.OTHER;
}