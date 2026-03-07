import { SpriteManager } from "../sprite/spriteManager.js";
import { EntityManager } from "./entityManager.js";

export const Entity = function(id, DEBUG_NAME = "") {
    this.DEBUG_NAME = DEBUG_NAME;
    this.id = id;
    this.index = EntityManager.INVALID_INDEX;
    this.spriteID = SpriteManager.INVALID_ID;
    this.isMarkedForDestroy = false;
    this.flags = 0;
}

Entity.prototype.reset = function() {
    this.index = EntityManager.INVALID_INDEX;
    this.spriteID = SpriteManager.INVALID_ID;
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