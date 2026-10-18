import { FIXED_DELTA_TIME, MAX_TICKS } from "./engine_constants.js";

export const Timer = function() {
    this.tick = 0;
    this.realTime = 0;
    this.lastTime = 0;
    this.lastDraw = 0;
    this.deltaTime = 0;
    this.accumulatedTime = 0;
    this.targetFPS = 60;
    this.targetDelta = 1 / this.targetFPS;
    this.smoothFPS = this.targetFPS;
    this.smoothFactor = 0.05;
}

Timer.prototype.beginFrame = function(timestamp) {
    this.realTime = timestamp / 1000;
    this.deltaTime = this.realTime - this.lastTime;
    this.accumulatedTime += this.deltaTime;
}

Timer.prototype.endFrame = function() {
    this.lastTime = this.realTime;
}

Timer.prototype.shouldRender = function() {
    return (this.realTime - this.lastDraw + 0.0001) >= this.targetDelta;
}

Timer.prototype.beginRender = function() {
    this.deltaTime = this.realTime - this.lastDraw;
    this.smoothFPS = (1 - this.smoothFactor) * this.smoothFPS + this.smoothFactor * (1 / this.deltaTime);
}

Timer.prototype.endRender = function() {
    this.lastDraw = this.realTime;
}

Timer.prototype.shouldTick = function() {
    return this.accumulatedTime >= FIXED_DELTA_TIME;
}

Timer.prototype.doTick = function() {
    if(++this.tick >= MAX_TICKS) {
        this.tick = 0;
    }

    this.accumulatedTime -= FIXED_DELTA_TIME;
}

Timer.prototype.setTarget = function(targetFPS) {
    this.targetFPS = targetFPS;
    this.targetDelta = 1 / targetFPS;
}

/*
Timer.prototype.nextFrame = function(timestamp) {
    this.realTime = timestamp / 1000;
    this.deltaTime = this.realTime - this.lastTime;
    this.accumulatedTime += this.deltaTime;
    //work

    while(this.accumulatedTime >= FIXED_DELTA_TIME) {
        if(++this.tick >= MAX_TICKS) {
            this.tick = 0;
        }

        //update
        this.accumulatedTime -= FIXED_DELTA_TIME;
    }

    if((this.realTime - this.lastDraw + 0.0001) >= this.targetDelta) {
        this.deltaTime = this.realTime - this.lastDraw;
        this.smoothFPS = (1 - this.smoothFactor) * this.smoothFPS + this.smoothFactor * (1 / this.deltaTime);
        //input
        //render
        this.lastDraw = this.realTime;
    }
    
    this.lastTime = this.realTime;
    //queue
}
*/