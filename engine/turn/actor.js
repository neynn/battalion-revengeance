export const Actor = function(id) {
    this.id = id;
    this.endRequested = false;
    this.maxActions = 1;
    this.turn = 0;
    this.actionIntents = [];
    this.maxIntents = 10;
}

Actor.prototype.load = function(blob) {}

Actor.prototype.save = function() {
    return {
        "id": this.id
    }
}

Actor.prototype.update = function(gameContext) {}

Actor.prototype.activeUpdate = function(gameContext, actionsLeft) {}

Actor.prototype.onTurnStart = function(gameContext) {}

Actor.prototype.onTurnEnd = function(gameContext) {}

Actor.prototype.startTurn = function(gameContext) {
    this.endRequested = false;
    this.turn++;
    this.onTurnStart(gameContext);
}

Actor.prototype.endTurn = function(gameContext) {
    this.onTurnEnd(gameContext);
}

Actor.prototype.requestTurnEnd = function() {
    this.endRequested = true;
}

Actor.prototype.setMaxActions = function(maxActions) {
    this.maxActions = maxActions;
}

Actor.prototype.getID = function() {
    return this.id;
}

Actor.prototype.addIntent = function(intent) {
    if(this.actionIntents.length < this.maxIntents) {
        intent.setActor(this.id);

        this.actionIntents.push(intent);
    }
}

Actor.prototype.tryEnqueueAction = function(gameContext) {
    const { world } = gameContext;
    const { actionQueue, turnManager } = world;

    if(!turnManager.isActor(this.id) || actionQueue.isRunning()) {
        return;
    }

    for(let i = 0; i < this.actionIntents.length; i++) {
        const actionIntent = this.actionIntents[i];
        const executionPlan = actionQueue.createExecutionPlan(gameContext, actionIntent);

        if(executionPlan) {
            actionQueue.enqueue(executionPlan);

            this.actionIntents.splice(0, i + 1);
            return;
        }
    }

    this.actionIntents.length = 0;
}