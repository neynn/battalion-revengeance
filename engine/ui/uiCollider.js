import { EventEmitter } from "../events/eventEmitter.js";
import { isCircleCicleIntersect, isRectangleRectangleIntersect } from "../math/math.js";
import { SHAPE } from "../math/constants.js";

export const UICollider = function() {
    this.positionX = -1;
    this.positionY = -1;
    this.width = -1;
    this.height = -1;
    this.collisions = 0;
    this.duration = 0;
    this.shape = SHAPE.RECTANGLE;
    this.state = UICollider.STATE.NOT_COLLIDED;

    this.events = new EventEmitter();
    this.events.listen(UICollider.EVENT.CLICKED);
    this.events.listen(UICollider.EVENT.FIRST_COLLISION);
    this.events.listen(UICollider.EVENT.LAST_COLLISION);
    this.events.listen(UICollider.EVENT.REPEATED_COLLISION);
}

UICollider.STATE = {
    NOT_COLLIDED: 0,
    COLLIDED: 1
};

UICollider.EVENT = {
    LAST_COLLISION: "LAST_COLLISION",
    FIRST_COLLISION: "FIRST_COLLISION",
    REPEATED_COLLISION: "REPEATED_COLLISION",
    CLICKED: "CLICKED"
};

UICollider.prototype.setShape = function(shape) {
    const shapes = Object.values(SHAPE);
    const isShapeValid = shapes.includes(shape);

    if(isShapeValid) {
        this.shape = shape;
    }
}

UICollider.prototype.setPosition = function(positionX, positionY) {
    this.positionX = positionX;
    this.positionY = positionY;
}

UICollider.prototype.setSize = function(width, height) {
    this.width = width;
    this.height = height;
}

UICollider.prototype.isColliding = function(mouseX, mouseY, mouseRange) {
    switch(this.shape) {
        case SHAPE.RECTANGLE: return isRectangleRectangleIntersect(this.positionX, this.positionY, this.width, this.height, mouseX, mouseY, mouseRange, mouseRange);
        case SHAPE.CIRCLE: return isCircleCicleIntersect(this.positionX, this.positionY, this.width, mouseX, mouseY, mouseRange);
        default: return false;
    }
}

UICollider.prototype.onCollisionUpdate = function(state, mouseX, mouseY, mouseRange) {
    switch(state) {
        case UICollider.STATE.COLLIDED: {
            switch(this.state) {
                case UICollider.STATE.NOT_COLLIDED: {
                    this.collisions++;
                    this.state = UICollider.STATE.COLLIDED;
                    this.events.emit(UICollider.EVENT.FIRST_COLLISION, mouseX, mouseY, mouseRange);
                    break;
                }
                case UICollider.STATE.COLLIDED: {
                    this.collisions++;
                    this.events.emit(UICollider.EVENT.REPEATED_COLLISION, mouseX, mouseY, mouseRange);
                    break;
                }
            }
            break;
        }
        case UICollider.STATE.NOT_COLLIDED: {
            switch(this.state) {
                case UICollider.STATE.COLLIDED: {
                    this.collisions = 0;
                    this.state = UICollider.STATE.NOT_COLLIDED;
                    this.events.emit(UICollider.EVENT.LAST_COLLISION, mouseX, mouseY, mouseRange);
                    break;
                }
                case UICollider.STATE.NOT_COLLIDED: {
                    break;
                }
            }
            break;
        }
    }
}

UICollider.prototype.click = function(mouseX, mouseY, mouseRange) {
    this.events.emit(UICollider.EVENT.CLICKED, mouseX, mouseY, mouseRange);
}