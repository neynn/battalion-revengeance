import { clampValue, loopValue } from "../math/math.js";

export const Scroller = function(stub) {
    this.stub = stub;
    this.values = [];
    this.index = 0;
}

Scroller.prototype.clearValues = function() {
    this.values.length = 0;
}

Scroller.prototype.addValue = function(value) {
    this.values.push(value);
}

Scroller.prototype.setValues = function(values) {
    this.values = values;
}

Scroller.prototype.scroll = function(delta) {
    this.index = clampValue(this.index + delta, this.values.length - 1, 0);

    return this.getValue();
}

Scroller.prototype.loop = function(delta) {
    this.index = loopValue(this.index + delta, this.values.length - 1, 0);

    return this.getValue();
}

Scroller.prototype.getValue = function() {
    if(this.index < 0 || this.index >= this.values.length) {
        return this.stub;
    }
    
    return this.values[this.index];
}

Scroller.prototype.getInfo = function() {
    const info = `${this.index + 1} / ${this.values.length}`;

    return info;
}

