export const Objective = function(type, parameter, target) {
    this.type = type;
    this.parameter = parameter;
    this.target = target;
    this.value = 0;
    this.state = Objective.STATE.INCOMPLETE;
}

Objective.STATE = {
    INCOMPLETE: 0,
    COMPLETE: 1
};

Objective.prototype.save = function() {
    return {
        "value": this.value
    }
}

Objective.prototype.load = function(blob) {
    const { value } = blob;

    if(value < 0) {
        this.value = 0;
    } else if(value > this.target) {
        this.value = this.target;
    } else {
        this.value = value;
    }
}

Objective.prototype.isMatching = function(type, parameter) {
    return this.state === Objective.STATE.INCOMPLETE && this.type === type && this.parameter === parameter;
}

Objective.prototype.progress = function(count) {
    this.value += count;

    if(this.value >= this.target) {
        this.state = Objective.STATE.COMPLETE;
        this.value = this.target;
    }

    return this.state;
}