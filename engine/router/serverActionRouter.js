import { TypeRegistry } from "../../src/type/typeRegistry.js";
import { ActionIntent } from "../action/actionIntent.js";
import { ActionRouter } from "./actionRouter.js";

export const ServerActionRouter = function() {
    ActionRouter.call(this);

    this.receivable.add(TypeRegistry.ACTION_TYPE.MOVE);
    this.receivable.add(TypeRegistry.ACTION_TYPE.ATTACK);
    this.receivable.add(TypeRegistry.ACTION_TYPE.END_TURN);
    this.maxActionsPerTick = 1000;
    this.isUpdating = false;
}

ServerActionRouter.prototype = Object.create(ActionRouter.prototype);
ServerActionRouter.prototype.constructor = ServerActionRouter;

ServerActionRouter.prototype.updateActionQueue = function(gameContext) {
    if(this.isUpdating) {
        return;
    }

    const { world } = gameContext;
    const { actionQueue, entityManager } = world;
    let count = 0;

    this.isUpdating = true;

    while(count < this.maxActionsPerTick && actionQueue.isRunning()) {
        actionQueue.update(gameContext);
        count++;
    }

    this.isUpdating = false;
}

ServerActionRouter.prototype.dispatch = function(gameContext, executionPlan) {
    const { world } = gameContext;
    const { actionQueue } = world;

    //Keep dispatch for now. Gets called in TurnActor.
}

ServerActionRouter.prototype.forceEnqueue = function(gameContext, actionIntent) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const executionPlan = actionQueue.createExecutionPlan(gameContext, actionIntent);

    if(!executionPlan) {
        return;
    }

    actionQueue.enqueue(executionPlan);

    this.updateActionQueue(gameContext);
}

ServerActionRouter.prototype.onPlayerIntent = function(gameContext, clientID, intent) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const { actor, type, data } = intent;

    if(!this.receivable.has(type)) {
        return;
    }
    
    const actionIntent = new ActionIntent(type, data);

    actionIntent.setActor(actor);

    const executionPlan = actionQueue.createExecutionPlan(gameContext, actionIntent);

    if(!executionPlan) {
        return;
    }

    actionQueue.enqueue(executionPlan);
    
    this.updateActionQueue(gameContext);
}