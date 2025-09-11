import { Entity } from "../../engine/entity/entity.js";

export const BattalionEntity = function(id, config, sprite) {
    Entity.call(this, id, "");

    this.tileX = -1;
    this.tileY = -1;
    this.config = config;
    this.sprite = sprite;
}

BattalionEntity.SPRITE_TYPE = {
    IDLE_RIGHT: "idle_right",
    IDLE_LEFT: "idle_left",
    IDLE_DOWN: "idle_down",
    IDLE_UP: "idle_up",
    FIRE_RIGHT: "fire_right",
    FIRE_LEFT: "fire_left",
    FIRE_DOWN: "fire_down",
    FIRE_UP: "fire_up",
};

BattalionEntity.prototype = Object.create(Entity.prototype);
BattalionEntity.prototype.constructor = BattalionEntity;

BattalionEntity.prototype.setSpritePosition = function(positionVector) {
    const { x, y } = positionVector;
    const sprite = this.sprite.parent;

    if(sprite) {
        sprite.setPosition(x, y);
    }
}