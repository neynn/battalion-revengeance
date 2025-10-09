import { SchemaSprite } from "./schemaSprite.js";

export const EntitySprite = function() {
    SchemaSprite.call(this);
}

EntitySprite.prototype = Object.create(SchemaSprite.prototype);
EntitySprite.prototype.constructor = EntitySprite;

EntitySprite.prototype.lockEnd = function() {
    if(this.parent) {
        this.parent.lockLoop();
    }
}

EntitySprite.prototype.unlockEnd = function() {
    if(this.parent) {
        this.parent.freeLoop();
    }
}