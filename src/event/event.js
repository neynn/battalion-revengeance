export const Event = function(id, turn, next, triggers) {
    this.id = id;
    this.turn = turn;
    this.next = next;
    this.triggers = triggers;
}

Event.prototype.trigger = function(gameContext) {

}