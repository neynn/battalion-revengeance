export const ActionIntent = function(type, data) {
    this.type = type;
    this.data = data;
}

ActionIntent.prototype.toJSON = function() {
    return {
        "type": this.type,
        "data": this.data
    }
}