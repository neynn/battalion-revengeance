export const ActionIntent = function(type, data) {
    this.type = type;
    this.data = data;
    this.actorID = -1;
}

ActionIntent.prototype.setActor = function(actorID) {
    this.actorID = actorID;
}

ActionIntent.prototype.fromJSON = function(json) {
    const { type, data, actor } = json;

    this.type = type;
    this.data = data;
    this.actorID = actor;
}

ActionIntent.prototype.toJSON = function() {
    return {
        "type": this.type,
        "data": this.data,
        "actor": this.actorID
    }
}