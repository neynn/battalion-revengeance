import { isCircleCicleIntersect, isRectangleRectangleIntersect } from "../math/math.js";
import { SHAPE } from "../math/constants.js";

export const Collider = function() {
    this.positionX = -1;
    this.positionY = -1;
    this.width = 0;
    this.height = 0;
    this.shape = SHAPE.RECTANGLE;
}

Collider.COLLISION_STATE = {
    NOT_COLLIDED: 0,
    COLLIDED: 1
};

Collider.prototype.onCollisionUpdate = function(state, mouseX, mouseY, mouseRange) {}

Collider.prototype.setShape = function(shape) {
    const shapes = Object.values(SHAPE);
    const isShapeValid = shapes.includes(shape);

    if(isShapeValid) {
        this.shape = shape;
    }
}

Collider.prototype.updatePosition = function(deltaX, deltaY) {
    this.positionX += deltaX;
    this.positionY += deltaY;
}

Collider.prototype.setPosition = function(positionX, positionY) {
    this.positionX = positionX;
    this.positionY = positionY;
}

Collider.prototype.setSize = function(width, height) {
    this.width = width;
    this.height = height;
}

Collider.prototype.isColliding = function(mouseX, mouseY, mouseRange) {
    switch(this.shape) {
        case SHAPE.RECTANGLE: return isRectangleRectangleIntersect(this.positionX, this.positionY, this.width, this.height, mouseX, mouseY, mouseRange, mouseRange);
        case SHAPE.CIRCLE: return isCircleCicleIntersect(this.positionX, this.positionY, this.width, mouseX, mouseY, mouseRange);
        default: return false;
    }
}