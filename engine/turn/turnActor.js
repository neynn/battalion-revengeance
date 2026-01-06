export const TurnActor = function(id) {
    this.id = id;
    this.endRequested = false;
    this.maxActions = 1;
    this.turn = 0;
    this.actionIntents = [];
    this.maxIntents = 10;
}

TurnActor.prototype.load = function(blob) {}

TurnActor.prototype.save = function() {
    return {
        "id": this.id
    }
}

TurnActor.prototype.update = function(gameContext) {}

TurnActor.prototype.activeUpdate = function(gameContext, actionsLeft) {}

TurnActor.prototype.onTurnStart = function(gameContext) {}

TurnActor.prototype.onTurnEnd = function(gameContext) {}

TurnActor.prototype.startTurn = function(gameContext) {
    this.endRequested = false;
    this.turn++;
    this.onTurnStart(gameContext);
}

TurnActor.prototype.endTurn = function(gameContext) {
    this.actionIntents.length = 0;
    this.onTurnEnd(gameContext);
}

TurnActor.prototype.requestTurnEnd = function() {
    this.endRequested = true;
}

TurnActor.prototype.setMaxActions = function(maxActions) {
    this.maxActions = maxActions;
}

TurnActor.prototype.getID = function() {
    return this.id;
}

TurnActor.prototype.addIntent = function(intent) {
    if(this.actionIntents.length < this.maxIntents) {
        intent.setActor(this.id);

        this.actionIntents.push(intent);
    }
}

TurnActor.prototype.tryEnqueueAction = function(gameContext) {
    const { world, actionRouter } = gameContext;
    const { actionQueue, turnManager } = world;

    if(!turnManager.isActor(this.id) || actionQueue.isRunning()) {
        return;
    }

    for(let i = 0; i < this.actionIntents.length; i++) {
        const executionPlan = actionQueue.createExecutionPlan(gameContext, this.actionIntents[i]);

        if(executionPlan) {
            actionRouter.dispatch(gameContext, executionPlan);
            this.actionIntents.splice(0, i + 1);
            return;
        }
    }

    this.actionIntents.length = 0;
}