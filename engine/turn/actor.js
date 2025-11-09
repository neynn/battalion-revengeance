export const Actor = function(id) {
    this.id = id;
    this.config = null;
    this.endRequested = false;
    this.maxActions = 1;
    this.turn = 0;
    this.actionRequests = [];
    this.maxRequests = 10;
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

Actor.prototype.setConfig = function(config) {
    if(config !== undefined) {
        this.config = config;
    }
} 

Actor.prototype.queueRequest = function(request) {
    if(this.actionRequests.length < this.maxRequests) {
        this.actionRequests.push(request);
    }
}

Actor.prototype.tryEnqueueAction = function(gameContext) {
    const { world } = gameContext;
    const { actionQueue, turnManager } = world;

    if(!turnManager.isActor(this.id) || actionQueue.isRunning()) {
        return false;
    }

    for(let i = 0; i < this.actionRequests.length; i++) {
        const executionRequest = actionQueue.createExecutionRequest(gameContext, this.actionRequests[i]);

        if(executionRequest) {
            executionRequest.setActor(this.id);
            actionQueue.enqueue(executionRequest);

            this.actionRequests.splice(0, i + 1);
            
            return true;
        }
    }

    this.actionRequests.length = 0;

    return false;
}