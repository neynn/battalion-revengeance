import { AnimationSystem } from "../systems/animation.js";

export const ProductionComponent = function() {
    this.passedTime = 0;
    this.state = ProductionComponent.STATE.NOT_PRODUCING;
    this.isAutomatic = false;
    this.type = null;
}

ProductionComponent.STATE = {
    NOT_PRODUCING: 0,
    PRODUCING: 1,
    FINISHED: 2,
    SPOILED: 3
};

ProductionComponent.prototype.update = function(gameContext, entity) {
    if(this.state === ProductionComponent.STATE.PRODUCING) {
        const { timer } = gameContext;
        const deltaTime = timer.getFixedDeltaTime();
        const time = this.isAutomatic ? entity.config.collectableTimeSeconds : gameContext.getProductionType(this.type).collectableTimeSeconds;

        this.passedTime += deltaTime;
    
        if(this.passedTime >= time) {
            this.passedTime = time;
            this.state = ProductionComponent.STATE.FINISHED;

            AnimationSystem.playAttention(gameContext, entity);
        }
    } else if(this.state === ProductionComponent.STATE.FINISHED) {
        if(!this.isAutomatic) {
            //spoil timer.
        }
    }
}

ProductionComponent.prototype.plantHFE = function(type) {
    if(!this.isAutomatic) {
        this.passedTime = 0;
        this.type = type;
        this.state = ProductionComponent.STATE.PRODUCING;
    }
}

ProductionComponent.prototype.getRewards = function(gameContext, entity) {
    if(this.isAutomatic) {
        return entity.config.collectRewards;
    }

    return gameContext.getProductionType(this.type).rewards;
}

ProductionComponent.prototype.reset = function() {
    this.passedTime = 0;
    this.type = null;

    if(this.isAutomatic) {
        this.state = ProductionComponent.STATE.PRODUCING;
    } else {
        this.state = ProductionComponent.STATE.NOT_PRODUCING;
    }
}

ProductionComponent.prototype.isFinished = function() {
    return this.state === ProductionComponent.STATE.FINISHED;
}

ProductionComponent.prototype.save = function() {
    if(this.isAutomatic) {
        return [this.passedTime, this.state];
    }

    return [this.passedTime, this.state, this.type];
}

ProductionComponent.prototype.load = function(blob) {
    if(this.isAutomatic) {
        const [ passedTime, state ] = blob;

        this.passedTime = passedTime;
        this.state = state;
    } else {
        const [ passedTime, state, type ] = blob;

        this.passedTime = passedTime;
        this.state = state;
        this.type = type;
    }
}

ProductionComponent.prototype.init = function(config) {
    const { isAutomatic } = config;

    if(isAutomatic) {
        this.isAutomatic = true;
        this.state = ProductionComponent.STATE.PRODUCING;
    }
}