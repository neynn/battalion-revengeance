export const MouseButton = function() {
    this.state = MouseButton.STATE.UP; 
    this.downStartTime = 0;
}

MouseButton.STATE = {
    UP: 0,
    DOWN: 1,
    DRAG: 2
};

MouseButton.DRAG = {
    DISTANCE_THRESHOLD_SQUARED: 36,
    DELAY_THRESHOLD_MILLISECONDS: 120
};

MouseButton.prototype.onMouseUp = function() {
    if(this.state === MouseButton.STATE.UP) {
        return;
    }

    this.state = MouseButton.STATE.UP;
    this.downStartTime = 0;
}

MouseButton.prototype.onMouseDown = function() {
    if(this.state !== MouseButton.STATE.UP) {
        return;
    }

    this.state = MouseButton.STATE.DOWN;
    this.downStartTime = Date.now();
}

MouseButton.prototype.onMouseMove = function(deltaX, deltaY) {
    if(this.state !== MouseButton.STATE.DOWN) {
        return;
    }

    const isDragging = this.isDragging(deltaX, deltaY);
    
    if(isDragging) {
        this.state = MouseButton.STATE.DRAG;
    }
}

MouseButton.prototype.isDragging = function(deltaX, deltaY) {
    const elapsedTime = Date.now() - this.downStartTime;

    if(elapsedTime >= MouseButton.DRAG.DELAY_THRESHOLD_MILLISECONDS) {
        return true;
    }

    const distance = deltaX * deltaX + deltaY * deltaY;

    return distance >= MouseButton.DRAG.DISTANCE_THRESHOLD_SQUARED;
}