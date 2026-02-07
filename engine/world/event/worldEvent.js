export const WorldEvent = function(id, components) {
    this.id = id;
    this.turn = WorldEvent.INVALID_TIME;
    this.round = WorldEvent.INVALID_TIME;
    this.next = null;
    this.components = components;
}

WorldEvent.INVALID_TIME = -1;

WorldEvent.prototype.execute = function(gameContext) {
    for(let i = 0; i < this.components.length; i++) {
        this.components[i].execute(gameContext);
    }
}

WorldEvent.prototype.setNext = function(next) {
    if(next !== undefined && next !== this.id) {
        this.next = next;
    }
}

WorldEvent.prototype.setTriggerTime = function(turn = WorldEvent.INVALID_TIME, round = WorldEvent.INVALID_TIME) {
    this.turn = turn;
    this.round = round;
}

WorldEvent.prototype.isTriggeredByTurn = function(globalTurn) {
    return this.turn !== WorldEvent.INVALID_TIME && globalTurn >= this.turn;
}

WorldEvent.prototype.isTriggeredByRound = function(globalRound) {
    return this.round !== WorldEvent.INVALID_TIME && globalRound >= this.round;
}