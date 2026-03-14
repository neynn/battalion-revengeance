export const MouseButton = function() {
    this.previous = MouseButton.STATE.UP;
    this.state = MouseButton.STATE.UP; 
    this.flags = MouseButton.FLAG.NONE;
    this.downStartTime = 0;
}

MouseButton.FLAG = {
    NONE: 0,
    DRAG: 1 << 0,
    UP: 1 << 1,
    DOWN: 1 << 2,
    HELD: 1 << 3
};

MouseButton.STATE = {
    UP: 0,
    DOWN: 1
};

MouseButton.prototype.update = function() {
    this.flags &= ~(MouseButton.FLAG.UP | MouseButton.FLAG.DOWN);

    switch(this.state) {
        case MouseButton.STATE.UP: {
            if(this.previous === MouseButton.STATE.DOWN) {
                this.flags |= MouseButton.FLAG.UP;
            }

            this.flags &= ~MouseButton.FLAG.HELD;
            break;
        }
        case MouseButton.STATE.DOWN: {
            if(this.previous === MouseButton.STATE.UP) {
                this.flags |= MouseButton.FLAG.DOWN;
            }

            this.flags |= MouseButton.FLAG.HELD;
            break;
        }
    }

    this.previous = this.state;
}

MouseButton.prototype.onMouseUp = function() {
    if(this.state !== MouseButton.STATE.UP) {
        this.state = MouseButton.STATE.UP;
        this.flags &= ~MouseButton.FLAG.DRAG;
        this.downStartTime = 0;
    }
}

MouseButton.prototype.onMouseDown = function() {
    if(this.state === MouseButton.STATE.UP) {
        this.state = MouseButton.STATE.DOWN;
        this.downStartTime = Date.now();
    }
}

MouseButton.prototype.onMouseMove = function(deltaX, deltaY) {
    if(this.flags & MouseButton.FLAG.DRAG) {
        return;
    }

    if(this.state === MouseButton.STATE.DOWN) {
        const isDragging = this.isDragging(deltaX, deltaY);
        
        if(isDragging) {
            this.flags |= MouseButton.FLAG.DRAG;
        }
    }
}

MouseButton.prototype.isDragging = function(deltaX, deltaY) {
    const DISTANCE_THRESHOLD_SQUARED = 36;
    const DELAY_THRESHOLD_MILLISECONDS = 120;
    const elapsedTime = Date.now() - this.downStartTime;

    if(elapsedTime >= DELAY_THRESHOLD_MILLISECONDS) {
        return true;
    }

    const distance = deltaX * deltaX + deltaY * deltaY;

    return distance >= DISTANCE_THRESHOLD_SQUARED;
}