export const Overlay = function() {
    this.alpha = 1;
    this.elements = [];
    this.count = 0;
}

Overlay.prototype.add = function(id, x, y) {
    this.count++;
    this.elements.push(id, x, y);
}

Overlay.prototype.clear = function() {
    this.count = 0;
    this.elements.length = 0;
}