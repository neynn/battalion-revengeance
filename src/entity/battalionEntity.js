import { Entity } from "../../engine/entity/entity.js";
import { BattalionSprite } from "./battalionSprite.js";

export const BattalionEntity = function(id) {
    Entity.call(this, id, "BATTALION");

    this.sprite = new BattalionSprite();
}

BattalionEntity.prototype = Object.create(Entity.prototype);
BattalionEntity.prototype.constructor = BattalionEntity;