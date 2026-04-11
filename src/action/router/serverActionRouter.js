import { ActionRouter } from "../../../engine/action/actionRouter.js";
import { GAME_EVENT } from "../../enums.js";
import { packPlan } from "../planPacker.js";

export const ServerActionRouter = function() {
    ActionRouter.call(this);

    this.maxActionsPerTick = 1000;
    this.isUpdating = false;
    this.version = 0;
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
    let sentBytes = 0;
    let limitReached = false;

    this.isUpdating = true;

    while(actionQueue.isRunning()) {
        const plan = actionQueue.mpFlushPlan(gameContext);

        if(plan === null) {
            break;
        }

        const packed = packPlan(plan);

        if(packed) {
            sentBytes += packed.byteLength;
            executedPlans.push(packed);
        }

        count++;

        if(count >= this.maxActionsPerTick) {
            limitReached = true;
            break;
        }
    }

    this.isUpdating = false;

    if(executedPlans.length !== 0) {
        console.log("SENT BYTES:", sentBytes);

        gameContext.broadcast(GAME_EVENT.MP_SERVER_UPDATE, {
            "version": this.version++,
            "plans": executedPlans
        });
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