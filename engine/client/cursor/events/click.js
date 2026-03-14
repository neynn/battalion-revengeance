export const MouseClickEvent = function() {
    this.button = 0;
    this.x = 0;
    this.y = 0;
    this.radius = 0;
}

MouseClickEvent.prototype.update = function(button, x, y, radius) {
    this.button = button;
    this.x = x;
    this.y = y;
    this.radius = radius;
}