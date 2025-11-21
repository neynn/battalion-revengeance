import { State } from "./state.js";

export const StateMachine = function(context) {
    this.isCurrentMachine = false;
    this.currentState = null;
    this.previousState = null;
    this.nextState = null;
    this.context = context;
    this.states = new Map();

    if(!context) {
        console.warn(`No context given to state machine!`);
    }
}

StateMachine.prototype = Object.create(State.prototype);
StateMachine.prototype.constructor = StateMachine;

StateMachine.prototype.isCurrent = function(stateID) {
    const state = this.states.get(stateID);

    if(!state) {
        return false;
    }

    return this.changeState === state;
}

StateMachine.prototype.setContext = function(context) {
    this.context = context;
}

StateMachine.prototype.update = function(gameContext) {
    if(this.currentState !== null) {
        this.currentState.onUpdate(gameContext, this);

        if(this.isCurrentMachine) {
            this.currentState.update();
        }
    }
}

StateMachine.prototype.eventEnter = function(gameContext, eventID, eventData) {
    if(this.currentState !== null) {
        this.currentState.onEvent(gameContext, this, eventID, eventData);

        if(this.isCurrentMachine) {
            this.currentState.eventEnter(gameContext, eventID, eventData);
        }
    }
}

StateMachine.prototype.exit = function(gameContext) {
    if(this.currentState !== null) {
        if(this.isCurrentMachine) {
            this.currentState.exit(gameContext);
        }

        this.currentState.onExit(gameContext, this);
        this.previousState = this.currentState;
        this.currentState = null;
        this.isCurrentMachine = false;
    }
}

StateMachine.prototype.changeState = function(gameContext, state, enterData = {}) {
    this.exit(gameContext);
    this.currentState = state;

    if(state instanceof StateMachine) {
        this.isCurrentMachine = true;
    }

    this.currentState.onEnter(gameContext, this, enterData);
}

StateMachine.prototype.setNextState = function(gameContext, stateID, enterData) {
    const nextState = this.states.get(stateID);

    if(nextState) {
        this.nextState = nextState;
        this.goToNextState(gameContext, enterData);
    } else {
        console.warn(`State (${stateID}) does not exist!`, this.context);
    }
}

StateMachine.prototype.goToPreviousState = function(gameContext, enterData) {
    this.changeState(gameContext, this.previousState, enterData);
}

StateMachine.prototype.goToNextState = function(gameContext, enterData) {
    this.changeState(gameContext, this.nextState, enterData);
}

StateMachine.prototype.getContext = function() {
    return this.context;
}

StateMachine.prototype.addState = function(stateID, state) {
    if(this.states.has(stateID)) {
        console.warn(`State (${stateID}) already exists!`);
        return;
    }

    if(!(state instanceof State)) {
        console.warn(`State (${stateID}) is not a state!`);
        return;
    }

    if(this.context !== null && state instanceof StateMachine) {
        state.setContext(this.context);
    }

    this.states.set(stateID, state);
}

StateMachine.prototype.removeState = function(stateID) {
    if(!this.states.has(stateID)) {
        console.warn(`State (${stateID}) is not registered!`);
        return;
    }

    this.states.delete(stateID);
}

StateMachine.prototype.reset = function() {
    this.currentState = null;
    this.previousState = null;
    this.nextState = null;
}