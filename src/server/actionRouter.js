import { ActionRouter } from "../../engine/action/actionRouter.js";
import { GAME_EVENT } from "../enums.js";

export const ServerActionRouter = function() {
    ActionRouter.call(this);

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
    const { actionQueue, eventHandler } = world;
    const executedPlans = [];
    let count = 0;

    this.isUpdating = true;

    while(count < this.maxActionsPerTick && actionQueue.isRunning()) {
        const plan = actionQueue.mpFlushPlan(gameContext);

        if(plan === null) {
            break;
        }

        executedPlans.push(plan.toJSON());
        count++;
    }

    this.isUpdating = false;

    if(executedPlans.length !== 0 || eventHandler.lastRecentlyTriggered.length !== 0) {
        gameContext.broadcastMessage(GAME_EVENT.MP_SERVER_STATE_UPDATE, {
            "plans": executedPlans,
            "events": eventHandler.lastRecentlyTriggered
        });

        eventHandler.clearRecentTriggers();
    }
}

ServerActionRouter.prototype.forceEnqueue = function(gameContext, actionIntent) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const executionPlan = actionQueue.createExecutionPlan(gameContext, actionIntent);

    if(!executionPlan) {
        console.error("Invalid execution plan created!");
        return;
    }

    actionQueue.enqueue(executionPlan);

    this.updateActionQueue(gameContext);
}