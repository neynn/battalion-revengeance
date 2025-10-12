export const SimpleQueue = function() {
    this.items = [];
}

SimpleQueue.prototype.enqueueFirst = function(item) {
    this.items.push(item);
}

SimpleQueue.prototype.enqueueLast = function(item) {
    this.items.unshift(item);
}

SimpleQueue.prototype.getNext = function() {
    return this.items.pop();
}