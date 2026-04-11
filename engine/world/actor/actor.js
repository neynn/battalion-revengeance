export const Actor = function(id) {
    this.id = id;
    this.turn = 0;
}

Actor.prototype.getID = function() {
    return this.id;
}

Actor.prototype.update = function(gameContext) {}
Actor.prototype.activeUpdate = function(gameContext) {}
Actor.prototype.onTurnStart = function(gameContext) {}
Actor.prototype.onTurnEnd = function(gameContext) {}