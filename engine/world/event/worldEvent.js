export const WorldEvent = function(id, name) {
    this.id = id;
    this.name = name;
    this.next = null;
    this.turn = WorldEvent.INVALID_TIME;
    this.round = WorldEvent.INVALID_TIME;
    this.simulation = [];
    this.effects = [];
}

WorldEvent.INVALID_ID = -1;
WorldEvent.INVALID_TIME = -1;

WorldEvent.prototype.setNext = function(next) {
    if(next !== WorldEvent.INVALID_ID && next !== this.id) {
        this.next = next;
    }
}

WorldEvent.prototype.addEffect = function(effect) {
    this.effects.push(effect);
}

WorldEvent.prototype.addSimulation = function(simulation) {
    this.simulation.push(simulation);
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