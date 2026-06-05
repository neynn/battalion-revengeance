import { EntityManager } from "./entityManager.js";

export const Entity = function(id) {
    this.id = id;
    this.index = EntityManager.INVALID_INDEX;
    this.isMarkedForDestroy = false;
    this.isHot = false;
    this.offsetX = 0;
    this.offsetY = 0;
    this.flags = 0;
    this.renderFlags = 0;
}

Entity.prototype.clearOffset = function() {
    this.offsetX = 0;
    this.offsetY = 0;
}

Entity.prototype.updateOffset = function(offsetX, offsetY) {
    this.offsetX += offsetX;
    this.offsetY += offsetY;
}

Entity.prototype.setOffset = function(offsetX, offsetY) {
    this.offsetX = offsetX;
    this.offsetY = offsetY;
}

Entity.prototype.reset = function() {
    this.index = EntityManager.INVALID_INDEX;
    this.flags = 0;
    this.renderFlags = 0;
}

Entity.prototype.hasRFlag = function(flag) {
    return (this.renderFlags & flag) !== 0;
}

Entity.prototype.setRFlag = function(flag) {
    this.renderFlags |= flag;
}

Entity.prototype.clearRFlag = function(flag) {
    this.renderFlags &= ~flag;
}

Entity.prototype.clearRFlags = function() {
    this.renderFlags = 0;
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

Entity.prototype.clearFlags = function() {
    this.flags = 0;
}

Entity.prototype.getIndex = function() {
    return this.index;
}

Entity.prototype.getID = function() {
    return this.id;
}

Entity.prototype.update = function(gameContext) {}