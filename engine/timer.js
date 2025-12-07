export const Timer = function(targetFPS = 60) {
    this.tick = 0;
    this.realTime = 0;
    this.lastTime = 0;
    this.deltaTime = 0;
    this.accumulatedTime = 0;
    this.targetFPS = targetFPS;
    this.fixedDeltaTime = 1 / targetFPS;
    this.smoothFPS = targetFPS;
    this.smoothFactor = 0.05;
    this._nextFrame = this.nextFrame.bind(this);
}

Timer.prototype.input = function() {}
Timer.prototype.update = function() {}
Timer.prototype.render = function() {}

Timer.prototype.setFPS = function(targetFPS) {
    this.targetFPS = targetFPS;
    this.fixedDeltaTime = 1 / targetFPS;
}

Timer.prototype.nextFrame = function(timestamp) {
    this.realTime = timestamp / 1000;
    this.deltaTime = this.realTime - this.lastTime;
    this.accumulatedTime += this.deltaTime;
    this.smoothFPS = (1 - this.smoothFactor) * this.smoothFPS + this.smoothFactor * (1 / this.deltaTime);

    this.input();

    while(this.accumulatedTime > this.fixedDeltaTime) {
        this.tick++;

        if(this.tick >= this.targetFPS) {
            this.tick = 0;
        }

        this.update();
        this.accumulatedTime -= this.fixedDeltaTime;
    }

    this.render();
    this.lastTime = this.realTime;
    this.queue();
}

Timer.prototype.queue = function() {
    requestAnimationFrame(this._nextFrame);
}

Timer.prototype.getFPS = function() {
    return this.smoothFPS;
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

Timer.prototype.getFixedDeltaTime = function() {
    return this.fixedDeltaTime;
}

Timer.prototype.getDeltaTime = function() {
    return this.deltaTime;
}