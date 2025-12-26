export const Entity = function(id, DEBUG_NAME = "") {
    this.DEBUG_NAME = DEBUG_NAME;
    this.id = id;
    this.isMarkedForDestroy = false;
    this.flags = 0;
}

Entity.prototype.clearFlags = function() {
    this.flags = 0;
}

Entity.prototype.hasFlag = function(flag) {
    return (this.flags & flag) !== 0;
}

Entity.prototype.setFlag = function(flag) {
    this.flags |= flag;
}

Entity.prototype.clearFlag = function(flag) {
    this.flags &= ~flag;
}

Entity.prototype.getID = function() {
    return this.id;
}

Entity.prototype.update = function(gameContext) {}
Entity.prototype.load = function(gameContext, data) {}
Entity.prototype.save = function() {}