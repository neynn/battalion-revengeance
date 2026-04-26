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
    this._nextFrame = this.nextFrame.bind(this);
}

Timer.prototype.work = function() {}
Timer.prototype.input = function() {}
Timer.prototype.update = function() {}
Timer.prototype.render = function() {}

Timer.prototype.nextFrame = function(timestamp) {
    this.realTime = timestamp / 1000;
    this.deltaTime = this.realTime - this.lastTime;
    this.accumulatedTime += this.deltaTime;
    this.work();

    while(this.accumulatedTime >= FIXED_DELTA_TIME) {
        if(++this.tick >= MAX_TICKS) {
            this.tick = 0;
        }

        this.update();
        this.accumulatedTime -= FIXED_DELTA_TIME;
    }

    if(this.realTime - this.lastDraw >= this.targetDelta) {
        this.deltaTime = this.realTime - this.lastDraw;
        this.smoothFPS = (1 - this.smoothFactor) * this.smoothFPS + this.smoothFactor * (1 / this.deltaTime);
        this.input();
        this.render();
        this.lastDraw = this.realTime;
    }
    
    this.lastTime = this.realTime;
    this.queue();
}

Timer.prototype.queue = function() {
    requestAnimationFrame(this._nextFrame);
}

Timer.prototype.getTick = function() {
    return this.tick;
}

Timer.prototype.start = function() {
    this.queue();
}

Timer.prototype.getRealTime = function() {
    return this.realTime;
}

Timer.prototype.getDeltaTime = function() {
    return this.deltaTime;
}

Timer.prototype.setTarget = function(targetFPS) {
    this.targetFPS = targetFPS;
    this.targetDelta = 1 / targetFPS;
} 