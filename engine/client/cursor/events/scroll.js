export const MouseScrollEvent = function() {
    this.direction = 0;
    this.deltaY = 0;
}

MouseScrollEvent.prototype.update = function(direction, deltaY) {
    this.direction = direction;
    this.deltaY = deltaY;
}