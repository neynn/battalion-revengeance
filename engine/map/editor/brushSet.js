export const BrushSet = function(name, invalid) {
    this.name = name;
    this.invalid = invalid; 
    this.values = [];
}

BrushSet.prototype.setValues = function(values) {
    this.values = values;
}

BrushSet.prototype.addValues = function(begin, end) {
    for(let i = begin; i <= end; i++) {
        this.values.push(i);
    }
}

BrushSet.prototype.addValue = function(value) {
    this.values.push(value);
}

BrushSet.prototype.getValue = function(index) {
    if(index < 0 || index >= this.values.length) {
        return this.invalid;
    }

    return this.values[index];
}

BrushSet.prototype.getSize = function() {
    return this.values.length;
}