import { EventEmitter } from "../events/eventEmitter.js";
import { ExecutionPlan } from "./executionPlan.js";
import { Queue } from "../util/queue.js";
import { Action } from "./action.js";

export const ActionQueue = function() {
    this.nextID = 0;
    this.actionTypes = new Map();
    this.intentQueue = [];
    this.executionQueue = new Queue(ActionQueue.MAX_ACTIONS);
    this.current = null;
    this.isSkipping = false;
    this.state = ActionQueue.STATE.ACTIVE;

    this.events = new EventEmitter();
    this.events.register(ActionQueue.EVENT.INVALID_PLAN);
}

ActionQueue.MAX_ACTIONS = 100;

ActionQueue.STATE = {
    NONE: 0,
    ACTIVE: 1,
    PROCESSING: 2,
    FLUSH: 3
};

ActionQueue.EVENT = {
    INVALID_PLAN: "INVALID_PLAN"
};

ActionQueue.prototype.update = function(gameContext) {
    if(!this.current) {
        this.current = this.getNextPlan(gameContext);

        if(!this.current) {
            return;
        }
    }

    const { type, data } = this.current;
    const actionType = this.actionTypes.get(type);

    switch(this.state) {
        case ActionQueue.STATE.ACTIVE: {
            this.current.setState(ExecutionPlan.STATE.RUNNING);
            actionType.onStart(gameContext, data);
            this.state = ActionQueue.STATE.PROCESSING;
            break;
        }
        case ActionQueue.STATE.PROCESSING: {
            actionType.onUpdate(gameContext, data);

            if(this.isSkipping || actionType.isFinished(gameContext, this.current)) {
                actionType.onEnd(gameContext, data);
                this.endExecutionPlan();
                this.state = ActionQueue.STATE.ACTIVE;
            }

            break;
        }
        case ActionQueue.STATE.FLUSH: {
            this.current.setState(ExecutionPlan.STATE.RUNNING);
            actionType.execute(gameContext, data);
            this.endExecutionPlan();
            break;
        }
    }
}

ActionQueue.prototype.getNextPlan = function(gameContext) {
    while(this.intentQueue.length !== 0) {
        const actionIntent = this.intentQueue.pop();
        const executionPlan = this.createExecutionPlan(gameContext, actionIntent);

        if(executionPlan) {
            this.enqueue(executionPlan, Action.PRIORITY.HIGH);
            break;
        }
    }

    return this.executionQueue.getNext();
}

ActionQueue.prototype.endExecutionPlan = function() {
    const { next } = this.current;

    for(let i = next.length - 1; i >= 0; i--) {
        this.intentQueue.push(next[i]);
    }

    this.current.setState(ExecutionPlan.STATE.FINISHED);
    this.isSkipping = false;
    this.current = null;
}

ActionQueue.prototype.createExecutionPlan = function(gameContext, actionIntent) {
    const { type, data } = actionIntent;
    const actionType = this.actionTypes.get(type);

    if(!actionType) {
        return null;
    }

    const executionPlan = new ExecutionPlan(this.nextID++, type, actionIntent);

    actionType.fillExecutionPlan(gameContext, executionPlan, data);

    if(!executionPlan.isValid()) {
        this.events.emit(ActionQueue.EVENT.INVALID_PLAN, {
            "intent": actionIntent,
            "plan": executionPlan
        });

        return null;
    }

    return executionPlan;
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
    return this.executionQueue.getSize() !== 0 || this.current !== null || this.intentQueue.length !== 0;
}

ActionQueue.prototype.toFlush = function() {
    this.state = ActionQueue.STATE.FLUSH;
}

ActionQueue.prototype.skip = function() {
    if(this.isRunning()) {
        this.isSkipping = true;
    }
}

ActionQueue.prototype.getPriority = function(typeID) {
    const actionType = this.actionTypes.get(typeID);

    if(!actionType) {
        return Action.PRIORITY.NONE;
    }

    const { priority } = actionType;

    return priority;
}