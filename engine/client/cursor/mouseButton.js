export const MouseButton = function() {
    this.state = MouseButton.STATE.UP; 
    this.flags = MouseButton.FLAG.NONE;
    this.downStartTime = 0;
    this.downImpulses = 0;
    this.upImpulses = 0;
}

MouseButton.FLAG = {
    NONE: 0,
    DRAG: 1 << 0,
    UP: 1 << 1,
    DOWN: 1 << 2
};

MouseButton.STATE = {
    UP: 0,
    DOWN: 1
};

//Assume downImpulses is always >= upImpulses.
MouseButton.prototype.update = function() {
    this.flags &= ~(MouseButton.FLAG.UP | MouseButton.FLAG.DOWN);
    let clicks = Math.min(this.downImpulses, this.upImpulses);

    if(this.downImpulses > 0) {
        if(this.state !== MouseButton.STATE.DOWN) {
            this.flags |= MouseButton.FLAG.DOWN;
        }
    }

    if(this.upImpulses > 0) {
        this.flags |= MouseButton.FLAG.UP;

        if(clicks === 0 && !(this.flags & MouseButton.FLAG.DRAG)) {
            clicks = 1;
        }
    }

    if(this.downImpulses > this.upImpulses) {
        if(this.state === MouseButton.STATE.UP) {
            this.state = MouseButton.STATE.DOWN;
        }
    } else {
        if(this.state === MouseButton.STATE.DOWN) {
            this.state = MouseButton.STATE.UP;
            this.flags &= ~MouseButton.FLAG.DRAG;
        }
    }

    this.downImpulses -= this.upImpulses;
    this.upImpulses = 0;

    if(this.downImpulses < 0) {
        this.downImpulses = 0;
    }

    return clicks;
}

MouseButton.prototype.onMouseUp = function() {
    this.upImpulses++;
    this.downStartTime = 0;
}

MouseButton.prototype.onMouseDown = function() {
    this.downImpulses++;
    this.downStartTime = Date.now();
}

MouseButton.prototype.onMouseMove = function(deltaX, deltaY) {
    if(this.flags & MouseButton.FLAG.DRAG) {
        return;
    }

    if(this.downImpulses > 0) {
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