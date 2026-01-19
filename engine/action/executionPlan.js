export const ExecutionPlan = function(id, type) {
    this.id = id;
    this.type = type;
    this.data = null;
    this.state = ExecutionPlan.STATE.NONE;
    this.next = [];
}

ExecutionPlan.STATE = {
    NONE: 0,
    RUNNING: 1,
    FINISHED: 2
};

ExecutionPlan.prototype.isValid = function() {
    return this.data !== null;
}

ExecutionPlan.prototype.setData = function(data) {
    this.data = data;
}

ExecutionPlan.prototype.addNext = function(intent) {
    this.next.push(intent);
}

ExecutionPlan.prototype.setState = function(stateID) {
    if(!Object.values(ExecutionPlan.STATE).includes(stateID)) {
        return;
    }

    this.state = stateID;
}

ExecutionPlan.prototype.toJSONServer = function() {
    return {
        "id": this.id,
        "type": this.type,
        "data": this.data
    }
}

ExecutionPlan.prototype.toJSON = function() {
    const next = [];

    for(let i = 0; i < this.next.length; i++) {
        next[i] = this.next[i].toJSON();
    }

    return {
        "id": this.id,
        "type": this.type,
        "data": this.data,
        "next": next
    }
}