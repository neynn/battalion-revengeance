export const Actor = function(id) {
    this.id = id;
    this.config = null;
    this.entities = new Set();
    this.maxActions = 1;
}

Actor.prototype.load = function(blob) {}

Actor.prototype.save = function() {
    return {
        "id": this.id
    }
}

Actor.prototype.update = function(gameContext) {}

Actor.prototype.onMakeChoice = function(gameContext, actionsLeft) {}

Actor.prototype.onTurnStart = function(gameContext) {}

Actor.prototype.onTurnEnd = function(gameContext) {}

Actor.prototype.setMaxActions = function(maxActions) {
    this.maxActions = maxActions;
}

Actor.prototype.getID = function() {
    return this.id;
}

Actor.prototype.addEntity = function(entityID) {
    if(!this.entities.has(entityID)) {
        this.entities.add(entityID);
    }
}

Actor.prototype.removeEntity = function(entityID) {
    if(this.entities.has(entityID)) {
        this.entities.delete(entityID);
    }
}

Actor.prototype.hasEntity = function(entityID) {
    return this.entities.has(entityID);
}

Actor.prototype.setConfig = function(config) {
    if(config !== undefined) {
        this.config = config;
    }
} 