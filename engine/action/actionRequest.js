export const ActionRequest = function(type, data) {
    this.type = type;
    this.data = data;
}

ActionRequest.prototype.toJSON = function() {
    return {
        "type": this.type,
        "data": this.data
    }
}