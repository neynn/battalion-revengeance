import { EventEmitter } from "../events/eventEmitter.js";
import { Collider } from "../graphics/collider.js";

export const UICollider = function() {
    Collider.call(this);

    this.duration = 0;
    this.collisions = 0;
    this.state = Collider.COLLISION_STATE.NOT_COLLIDED;

    this.events = new EventEmitter();
    this.events.register(UICollider.EVENT.FIRST_COLLISION);
    this.events.register(UICollider.EVENT.LAST_COLLISION);
}

UICollider.prototype = Object.create(Collider.prototype);
UICollider.prototype.constructor = UICollider;

UICollider.EVENT = {
    LAST_COLLISION: "LAST_COLLISION",
    FIRST_COLLISION: "FIRST_COLLISION"
};

UICollider.prototype.onCollisionUpdate = function(state, mouseX, mouseY, mouseRange) {
    switch(state) {
        case Collider.COLLISION_STATE.COLLIDED: {
            switch(this.state) {
                case Collider.COLLISION_STATE.NOT_COLLIDED: {
                    this.collisions++;
                    this.state = Collider.COLLISION_STATE.COLLIDED;
                    this.events.emit(UICollider.EVENT.FIRST_COLLISION, {
                        "x": mouseX,
                        "y": mouseY,
                        "range": mouseRange
                    });
                    break;
                }
                case Collider.COLLISION_STATE.COLLIDED: {
                    this.collisions++;
                    break;
                }
            }
            break;
        }
        case Collider.COLLISION_STATE.NOT_COLLIDED: {
            switch(this.state) {
                case Collider.COLLISION_STATE.COLLIDED: {
                    this.state = Collider.COLLISION_STATE.NOT_COLLIDED;
                    this.events.emit(UICollider.EVENT.LAST_COLLISION, {
                        "x": mouseX,
                        "y": mouseY,
                        "range": mouseRange,
                        "count": this.collisions
                    });

                    this.collisions = 0;
                    break;
                }
                case Collider.COLLISION_STATE.NOT_COLLIDED: {
                    break;
                }
            }
            break;
        }
    }
}