import { EventEmitter } from "../events/eventEmitter.js";
import { ExecutionRequest } from "./executionRequest.js";
import { Queue } from "../util/queue.js";
import { Action } from "./action.js";

export const ActionQueue = function() {
    this.nextID = 0;
    this.actionTypes = new Map();
    this.executionQueue = new Queue(ActionQueue.MAX_ACTIONS);
    this.current = null;
    this.isSkipping = false;
    this.state = ActionQueue.STATE.ACTIVE;

    this.events = new EventEmitter();
    this.events.register(ActionQueue.EVENT.EXECUTION_DEFER);
    this.events.register(ActionQueue.EVENT.EXECUTION_ERROR);
    this.events.register(ActionQueue.EVENT.EXECUTION_RUNNING);
    this.events.register(ActionQueue.EVENT.EXECUTION_COMPLETE);
}

ActionQueue.MAX_ACTIONS = 100;

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

ActionQueue.prototype.update = function(gameContext) {
    if(!this.current) {
        this.current = this.executionQueue.getNext();
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

    this.handleActionEnd(gameContext);
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

        this.handleActionEnd(gameContext);
        this.state = ActionQueue.STATE.ACTIVE;
    }
}

ActionQueue.prototype.handleActionEnd = function(gameContext) {
    const { next } = this.current;

    for(let i = next.length - 1; i >= 0; i--) {
        const executionRequest = this.createExecutionRequest(gameContext, next[i]);

        if(executionRequest) {
            this.enqueue(executionRequest, Action.PRIORITY.HIGH);
        }
    }

    this.current.setState(ExecutionRequest.STATE.FINISHED);
    this.events.emit(ActionQueue.EVENT.EXECUTION_COMPLETE, this.current);
    this.isSkipping = false;
    this.current = null;
}

ActionQueue.prototype.createExecutionRequest = function(gameContext, request) {
    const { type, data } = request;
    const actionType = this.actionTypes.get(type);

    if(actionType) {
        const executionRequest = new ExecutionRequest(this.nextID++, type);

        actionType.validate(gameContext, executionRequest, data);

        if(executionRequest.isValid()) {
            actionType.onValid(gameContext);

            return executionRequest;
        }

        actionType.onInvalid(gameContext);

        this.events.emit(ActionQueue.EVENT.EXECUTION_ERROR, request);
    }

    return null;
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
    this.executionQueue.clear();
    this.state = ActionQueue.STATE.ACTIVE;
    this.isSkipping = false;
    this.current = null;
    this.nextID = 0;
}

ActionQueue.prototype.enqueue = function(execution, forcedPriority = Action.PRIORITY.NONE) {
    if(!this.executionQueue.isFull()) {
        if(forcedPriority !== Action.PRIORITY.NONE) {
            this.enqueueByPriority(execution, forcedPriority);
        } else {
            const { type } = execution;
            const priority = this.getPriority(type);

            this.enqueueByPriority(execution, priority);
        }
    } else {
        console.error({
            "error": "The execution queue is full. Item has been discarded!",
            "item": execution
        });
    }
}

ActionQueue.prototype.enqueueByPriority = function(execution, priority) {
    switch(priority) {
        case Action.PRIORITY.HIGH: {
            this.executionQueue.enqueueFirst(execution);
            break;
        }
        case Action.PRIORITY.NORMAL: {
            this.executionQueue.enqueueLast(execution);
            break;
        }
        case Action.PRIORITY.LOW: {
            this.executionQueue.enqueueLast(execution);
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

ActionQueue.prototype.isSendable = function(typeID) {
    const actionType = this.actionTypes.get(typeID);

    if(!actionType) {
        return false;
    }

    return actionType.isSendable;
}

ActionQueue.prototype.getPriority = function(typeID) {
    const actionType = this.actionTypes.get(typeID);

    if(!actionType) {
        return Action.PRIORITY.NONE;
    }

    const { priority } = actionType;

    return priority;
}