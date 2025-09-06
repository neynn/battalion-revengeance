import { ArmyEventHandler } from "../armyEventHandler.js";
import { EntityDeathEvent } from "../events/entityDeath.js";
import { EntityDecayEvent } from "../events/entityDecay.js";

export const ReviveableComponent = function() {
    this.type = ReviveableComponent.TYPE.NONE;
    this.state = ReviveableComponent.STATE.NO_DECAY;
    this.passedTime = 0;
}

ReviveableComponent.TYPE = {
    NONE: 0,
    ELITE: 1
};

ReviveableComponent.STATE = {
    NO_DECAY: 0,
    DECAY: 1,
    DEAD: 2
};

ReviveableComponent.prototype.isDecaying = function() {
    return this.state === ReviveableComponent.STATE.DECAY;
}

ReviveableComponent.prototype.isAlive = function() {
    return this.state === ReviveableComponent.STATE.NO_DECAY;
}

ReviveableComponent.prototype.isDead = function() {
    return this.state === ReviveableComponent.STATE.DEAD;
}

ReviveableComponent.prototype.beginDecay = function() {
    if(this.type !== ReviveableComponent.TYPE.ELITE && this.state === ReviveableComponent.STATE.NO_DECAY) {
        this.state = ReviveableComponent.STATE.DECAY;
    }
}

ReviveableComponent.prototype.endDecay = function() {
    if(this.state !== ReviveableComponent.STATE.DEAD) {
        this.state = ReviveableComponent.STATE.NO_DECAY;
        this.passedTime = 0;
    }
}

ReviveableComponent.prototype.update = function(gameContext, entity) {
    if(this.state === ReviveableComponent.STATE.DECAY) {
        const { timer, world } = gameContext;
        const { eventBus } = world;
        const fixedDeltaTime = timer.getFixedDeltaTime();

        this.passedTime += fixedDeltaTime;

        if(this.passedTime >= gameContext.settings.downDuration) {
            this.passedTime = gameContext.settings.downDuration;
            this.state = ReviveableComponent.STATE.DEAD;

            eventBus.emit(ArmyEventHandler.TYPE.ENTITY_DECAY, EntityDecayEvent.createEvent(entity.getID()));
        }
    }
}

ReviveableComponent.prototype.save = function() {
    return [this.state, this.passedTime];
}

ReviveableComponent.prototype.load = function(blob) {
    const [ state, passedTime ] = blob;

    this.state = state;
    this.passedTime = passedTime;
} 

ReviveableComponent.prototype.init = function(config) {
    const { elite } = config;

    if(elite) {
        this.type = ReviveableComponent.TYPE.ELITE;
    }
}