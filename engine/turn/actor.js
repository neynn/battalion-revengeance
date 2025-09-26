export const Actor = function(id) {
    this.id = id;
    this.config = null;
    this.endRequested = false;
    this.maxActions = 1;
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