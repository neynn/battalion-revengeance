export const WorldEvent = function(id, name) {
    this.id = id;
    this.name = name;
    this.next = null;
    this.turn = WorldEvent.INVALID_TIME;
    this.round = WorldEvent.INVALID_TIME;
    this.simulation = [];
    this.effects = [];
    this.state = WorldEvent.STATE.ACTIVE;
}

WorldEvent.INVALID_ID = -1;
WorldEvent.INVALID_TIME = -1;

WorldEvent.STATE = {
    ACTIVE: 0,
    TRIGGERED: 1
};

WorldEvent.prototype.execute = function(gameContext) {
    for(const action of this.simulation) {
        action.execute(gameContext);
    }

    this.state = WorldEvent.STATE.TRIGGERED;
}

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

WorldEvent.prototype.isTriggerable = function(globalTurn, globalRound) {
    if(this.state !== WorldEvent.STATE.ACTIVE) {
        return false;
    }
    
    let isTriggerable = false;

    if(this.turn !== WorldEvent.INVALID_TIME) {
        isTriggerable = globalTurn >= this.turn;
    }

    if(this.round !== WorldEvent.INVALID_TIME) {
        if(!isTriggerable) {
            isTriggerable = globalRound >= this.round;
        }
    }

    return isTriggerable;
}