export const ConstructionComponent = function() {
    this.stepsCompleted = 0;
}

ConstructionComponent.CONSTRUCTION_FRAMES = [0, 0, 1, 1, 2];

ConstructionComponent.prototype.getFrame = function() {
    if(this.stepsCompleted < 0 || this.stepsCompleted >= ConstructionComponent.CONSTRUCTION_FRAMES.length) {
        return 0;
    }

    return ConstructionComponent.CONSTRUCTION_FRAMES[this.stepsCompleted];
}

ConstructionComponent.prototype.isComplete = function(maxSteps = 0) {
    return this.stepsCompleted >= maxSteps;
}

ConstructionComponent.prototype.advance = function(deltaSteps = 0) {
    this.stepsCompleted += deltaSteps;
}

ConstructionComponent.prototype.save = function() {
    return [this.stepsCompleted];
}

ConstructionComponent.prototype.load = function(blob) {
    const [ stepsCompleted ] = blob;

    this.stepsCompleted = stepsCompleted;
}
