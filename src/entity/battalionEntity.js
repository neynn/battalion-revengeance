import { Entity } from "../../engine/entity/entity.js";

export const BattalionEntity = function(id, sprite) {
    Entity.call(this, id, "BATTALION");

    this.tileX = -1;
    this.tileY = -1;
    this.sprite = sprite;
}

BattalionEntity.prototype = Object.create(Entity.prototype);
BattalionEntity.prototype.constructor = BattalionEntity;

BattalionEntity.prototype.setSpritePosition = function(positionVector) {
    const { x, y } = positionVector;
    const sprite = this.sprite.parent;

    if(sprite) {
        sprite.setPosition(x, y);
    }
}