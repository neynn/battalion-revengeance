import { Entity } from "../../engine/entity/entity.js";

export const BattalionEntity = function(id, sprite) {
    Entity.call(this, id, "");

    this.tileX = -1;
    this.tileY = -1;
    this.direction = BattalionEntity.DIRECTION.EAST;
    this.sprite = sprite;
}

BattalionEntity.DIRECTION = {
    NORTH: 1 << 0,
    EAST: 1 << 1,
    SOUTH: 1 << 2,
    WEST: 1 << 3
};

BattalionEntity.SPRITE_CATEGORY = {
    IDLE: 0,
    FIRE: 1
};

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

BattalionEntity.prototype.setPosition = function(positionVector) {
    const { x, y } = positionVector;

    this.sprite.setPosition(x, y);
}

BattalionEntity.prototype.setDirection = function(direction) {
    if(Object.values(BattalionEntity.DIRECTION).includes(direction)) {
        this.direction = direction;
    }
}

BattalionEntity.prototype.getSpriteTypeID = function(category) {
    switch(category) {
        case BattalionEntity.SPRITE_CATEGORY.IDLE: {
            switch(this.direction) {
                case BattalionEntity.DIRECTION.NORTH: return BattalionEntity.SPRITE_TYPE.IDLE_UP;
                case BattalionEntity.DIRECTION.EAST: return BattalionEntity.SPRITE_TYPE.IDLE_RIGHT;
                case BattalionEntity.DIRECTION.SOUTH: return BattalionEntity.SPRITE_TYPE.IDLE_DOWN;
                case BattalionEntity.DIRECTION.WEST: return BattalionEntity.SPRITE_TYPE.IDLE_LEFT;
            }
            break;
        }
        case BattalionEntity.SPRITE_CATEGORY.FIRE: {
            switch(this.direction) {
                case BattalionEntity.DIRECTION.NORTH: return BattalionEntity.SPRITE_TYPE.FIRE_UP;
                case BattalionEntity.DIRECTION.EAST: return BattalionEntity.SPRITE_TYPE.FIRE_RIGHT;
                case BattalionEntity.DIRECTION.SOUTH: return BattalionEntity.SPRITE_TYPE.FIRE_DOWN;
                case BattalionEntity.DIRECTION.WEST: return BattalionEntity.SPRITE_TYPE.FIRE_LEFT;
            }
            break;
        }
    }

    return BattalionEntity.SPRITE_TYPE.IDLE_RIGHT;
}

BattalionEntity.prototype.updateSprite = function(gameContext, category) {
    const spriteTypeID = this.getSpriteTypeID(category);
    const spriteID = this.config.sprites[spriteTypeID];

    if(spriteID !== undefined) {
        this.sprite.updateParent(gameContext, spriteID);
    }
}