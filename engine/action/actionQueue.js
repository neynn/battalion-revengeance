import { EventEmitter } from "../events/eventEmitter.js";
import { ExecutionRequest } from "./executionRequest.js";
import { Queue } from "../util/queue.js";
import { Action } from "./action.js";

export const ActionQueue = function() {
    this.nextID = 0;
    this.actionTypes = new Map();
    this.maxInstantActions = 100;
    this.immediateQueue = new Queue(100);
    this.executionQueue = new Queue(100);
    this.current = null;
    this.isSkipping = false;
    this.state = ActionQueue.STATE.ACTIVE;

    this.events = new EventEmitter();
    this.events.listen(ActionQueue.EVENT.EXECUTION_DEFER);
    this.events.listen(ActionQueue.EVENT.EXECUTION_ERROR);
    this.events.listen(ActionQueue.EVENT.EXECUTION_RUNNING);
    this.events.listen(ActionQueue.EVENT.EXECUTION_COMPLETE);
}

ActionQueue.STATE = {
    NONE: 0,
    ACTIVE: 1,
    PROCESSING: 2,
    FLUSH: 3
};

ActionQueue.EVENT = {
    EXECUTION_DEFER: "EXECUTION_DEFER",
    EXECUTION_ERROR: "EXECUTION_ERROR",
    EXECUTION_RUNNING: "EXECUTION_RUNNING",
    EXECUTION_COMPLETE: "EXECUTION_COMPLETE"
};

ActionQueue.prototype.isSendable = function(typeID) {
    const actionType = this.actionTypes.get(typeID);

    if(!actionType) {
        return false;
    }

    return actionType.isSendable;
}

ActionQueue.prototype.updateInstant = function(gameContext) {
    let instantActionsExecuted = 0;

    while(instantActionsExecuted < this.maxInstantActions && this.current) {
        const { type } = this.current;
        const isInstant = this.getInstant(type);

        if(!isInstant) {
            break;
        }

        this.flushExecution(gameContext);
        this.current = this.executionQueue.getNext();

        if(!this.current && !this.immediateQueue.isEmpty()) {
            this.updateImmediateQueue(gameContext);
            this.current = this.executionQueue.getNext();
        }

        instantActionsExecuted++;
    }

    const limitReached = instantActionsExecuted === this.maxInstantActions && this.current && this.getInstant(this.current.type);

    return limitReached;
}

ActionQueue.prototype.update = function(gameContext) {
    if(!this.current) {
        this.current = this.executionQueue.getNext();
    }

    const limitReached = this.updateInstant(gameContext);

    if(limitReached) {
        return;
    }

    switch(this.state) {
        case ActionQueue.STATE.ACTIVE: {
            this.startExecution(gameContext);
            break;
        }
        case ActionQueue.STATE.PROCESSING: {
            this.processExecution(gameContext);
            break;
        }
        case ActionQueue.STATE.FLUSH: {
            this.flushExecution(gameContext);
            break;
        }
    }

    this.updateImmediateQueue(gameContext);
}

ActionQueue.prototype.flushExecution = function(gameContext) {
    if(!this.current) {
        return;
    }

    const { type, data, id } = this.current;
    const actionType = this.actionTypes.get(type);

    this.events.emit(ActionQueue.EVENT.EXECUTION_RUNNING, this.current);
    this.current.setState(ExecutionRequest.STATE.RUNNING);

    actionType.onStart(gameContext, data, id);
    actionType.onEnd(gameContext, data, id);

    this.current.setState(ExecutionRequest.STATE.FINISHED);
    this.events.emit(ActionQueue.EVENT.EXECUTION_COMPLETE, this.current);
    this.clearCurrent();
}

ActionQueue.prototype.startExecution = function(gameContext) {
    if(!this.current) {
        return;
    }

    const { type, data, id } = this.current;
    const actionType = this.actionTypes.get(type);

    this.state = ActionQueue.STATE.PROCESSING;
    this.current.setState(ExecutionRequest.STATE.RUNNING);
    this.events.emit(ActionQueue.EVENT.EXECUTION_RUNNING, this.current);
        
    actionType.onStart(gameContext, data, id);
}

ActionQueue.prototype.processExecution = function(gameContext) {
    if(!this.current) {
        return;
    }

    const { timer } = gameContext;
    const deltaTime = timer.getFixedDeltaTime();

    const { type, data, id } = this.current;
    const actionType = this.actionTypes.get(type);

    this.current.advance(deltaTime);

    actionType.onUpdate(gameContext, data, id);

    if(this.isSkipping || actionType.isFinished(gameContext, this.current)) {
        actionType.onEnd(gameContext, data, id);

        this.current.setState(ExecutionRequest.STATE.FINISHED);
        this.events.emit(ActionQueue.EVENT.EXECUTION_COMPLETE, this.current);
        this.state = ActionQueue.STATE.ACTIVE;
        this.clearCurrent();
    }
}

ActionQueue.prototype.addImmediateRequest = function(request) {
    const { type } = request;
    const actionType = this.actionTypes.get(type);

    if(!actionType) {
        return;
    }

    this.immediateQueue.enqueueLast(request);
}

ActionQueue.prototype.updateImmediateQueue = function(gameContext) {
    if(this.current) {
        return;
    }

    this.immediateQueue.filterUntilFirstHit(request => {
        const executionRequest = this.createExecutionRequest(gameContext, request);

        if(executionRequest) {
            this.enqueue(executionRequest);

            return true;
        }

        return false;
    });
}

ActionQueue.prototype.getInstant = function(typeID) {
    const actionType = this.actionTypes.get(typeID);

    if(!actionType) {
        return false;
    }

    const { isInstant } = actionType;

    return isInstant;
}

ActionQueue.prototype.getPriority = function(typeID) {
    const actionType = this.actionTypes.get(typeID);

    if(!actionType) {
        return Action.PRIORITY.NONE;
    }

    const { priority } = actionType;

    return priority;
}

ActionQueue.prototype.createExecutionRequest = function(gameContext, request) {
    const { type, data } = request;
    const actionType = this.actionTypes.get(type);

    if(!actionType) {
        return null;
    }

    const validatedData = actionType.getValidated(gameContext, data);

    if(!validatedData) {
        this.events.emit(ActionQueue.EVENT.EXECUTION_ERROR, request);

        return null;
    }

    return new ExecutionRequest(this.nextID++, type, validatedData);
}

ActionQueue.prototype.registerAction = function(typeID, handler) {
    if(this.actionTypes.has(typeID)) {
        console.warn(`Action ${typeID} is already registered!`);
        return;
    }

    this.actionTypes.set(typeID, handler);
}

ActionQueue.prototype.exit = function() {
    this.events.muteAll();
    this.immediateQueue.clear();
    this.executionQueue.clear();
    this.state = ActionQueue.STATE.ACTIVE;
    this.clearCurrent();
    this.nextID = 0;
}

ActionQueue.prototype.clearCurrent = function() {
    this.isSkipping = false;
    this.current = null;
}

ActionQueue.prototype.enqueue = function(request) {
    if(this.executionQueue.isFull()) {
        console.error({
            "error": "The execution queue is full. Item has been discarded!",
            "item": request
        });

        return;
    }

    const { type } = request;
    const priority = this.getPriority(type);

    switch(priority) {
        case Action.PRIORITY.HIGH: {
            this.executionQueue.enqueueFirst(request);
            break;
        }
        case Action.PRIORITY.LOW: {
            this.executionQueue.enqueueLast(request);
            break;
        }
        default: {
            console.warn(`Unknown priority! ${priority}`);
            break;
        }
    }
}

ActionQueue.prototype.isEmpty = function() {
    return this.executionQueue.getSize() === 0;
}

ActionQueue.prototype.isRunning = function() {
    return this.executionQueue.getSize() !== 0 || this.current !== null;
}

ActionQueue.prototype.toFlush = function() {
    this.state = ActionQueue.STATE.FLUSH;
}

ActionQueue.prototype.skip = function() {
    if(this.isRunning()) {
        this.isSkipping = true;
    }
}