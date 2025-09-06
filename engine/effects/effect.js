export const Effect = function(id) {
    this.id = id;
}

Effect.prototype.getID = function() {
    return this.id;
}

Effect.prototype.isFinished = function() {
    return true;
}

Effect.prototype.update = function(context, deltaTime) {}