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
    const { actionQueue } = world;
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

    gameContext.broadcastMessage(GAME_EVENT.MP_SERVER_EXECUTE_PLAN, {
        "plans": executedPlans
    });
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