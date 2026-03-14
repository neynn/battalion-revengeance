export const MouseDragEvent = function() {
    this.button = 0;
    this.deltaX = 0;
    this.deltaY = 0;
}

MouseDragEvent.prototype.update = function(button, deltaX, deltaY) {
    this.button = button;
    this.deltaX = deltaX;
    this.deltaY = deltaY;
}