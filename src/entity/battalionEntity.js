import { Entity } from "../../engine/entity/entity.js";

export const BattalionEntity = function(id) {
    Entity.call(this, id, "BATTALION");
}

BattalionEntity.prototype = Object.create(Entity.prototype);
BattalionEntity.prototype.constructor = BattalionEntity;