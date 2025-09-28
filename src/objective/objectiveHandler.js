export const ObjectiveHandler = function() {
    this.objectives = [];
}

ObjectiveHandler.prototype.load = function(objectives) {
    this.objectives = objectives;
}