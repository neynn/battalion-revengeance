export const ExecutionRequest = function(id, type, data) {
    this.id = id;
    this.type = type;
    this.data = data;
    this.state = ExecutionRequest.STATE.NONE;
    this.timePassed = 0;
    this.actorID = null;
}

ExecutionRequest.STATE = {
    NONE: 0,
    RUNNING: 1,
    FINISHED: 2
};

ExecutionRequest.prototype.setActor = function(actorID) {
    this.actorID = actorID;
}

ExecutionRequest.prototype.advance = function(deltaTime) {
    this.timePassed += deltaTime;
}

ExecutionRequest.prototype.setState = function(stateID) {
    if(!Object.values(ExecutionRequest.STATE).includes(stateID)) {
        return;
    }

    this.state = stateID;
}

ExecutionRequest.prototype.toJSON = function() {
    return {
        "id": this.id,
        "type": this.type,
        "data": this.data
    }
}