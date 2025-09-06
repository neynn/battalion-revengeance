export const SwapSet = function() {
    this.previous = new Set();
    this.current = new Set();
}

SwapSet.prototype.swap = function() {
    [this.previous, this.current] = [this.current, this.previous];
    this.current.clear();
}

SwapSet.prototype.getCurrent = function() {
    return this.current;
}

SwapSet.prototype.clear = function() {
    this.previous.clear();
    this.current.clear();
}

SwapSet.prototype.addCurrent = function(element) {
    this.current.add(element);
}

SwapSet.prototype.isPrevious = function(element) {
    return this.previous.has(element);
}

SwapSet.prototype.isCurrent = function(element) {
    return this.current.has(element);
}