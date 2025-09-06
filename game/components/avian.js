export const AvianComponent = function() {
    this.state = AvianComponent.STATE.GROUNDED;
}

AvianComponent.STATE = {
    GROUNDED: 0,
    FLYING: 1
};

AvianComponent.prototype.toGround = function() {
    this.state = AvianComponent.STATE.GROUNDED;
}

AvianComponent.prototype.toAir = function() {
    this.state = AvianComponent.STATE.FLYING;
}

AvianComponent.prototype.isFlying = function() {
    return this.state === AvianComponent.STATE.FLYING;
}

AvianComponent.prototype.init = function(config) {
    const { flying } = config;

    if(flying) {
        this.state = AvianComponent.STATE.FLYING;
    }
}

AvianComponent.prototype.save = function() {
    return [this.state];
}

AvianComponent.prototype.load = function(blob) {
    const [ state ] = blob;

    this.state = state;
}