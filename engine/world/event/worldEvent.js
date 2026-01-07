export const WorldEvent = function(id, actions) {
    this.id = id;
    this.turn = WorldEvent.INVALID_TIME;
    this.round = WorldEvent.INVALID_TIME;
    this.next = null;
    this.actions = actions;
}

WorldEvent.INVALID_TIME = -1;

WorldEvent.prototype.execute = function(gameContext) {}

WorldEvent.prototype.setNext = function(next) {
    if(next !== undefined && next !== this.id) {
        this.next = next;
    }
}

WorldEvent.prototype.setTriggerTime = function(turn = WorldEvent.INVALID_TIME, round = WorldEvent.INVALID_TIME) {
    this.turn = turn;
    this.round = round;
}