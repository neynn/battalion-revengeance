import { ActionRouter } from "../../../engine/action/actionRouter.js";
import { GAME_EVENT } from "../../enums.js";
import { getGameUpdateHeaderSize } from "../packer_constants.js";
import { getPlanSize, writePlan } from "../planPacker.js";

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
    let limitReached = false;

    this.isUpdating = true;

    while(actionQueue.isRunning()) {
        const plan = actionQueue.mpFlushPlan(gameContext);

        if(plan === null) {
            break;
        }

        executedPlans.push(plan);
        count++;

        if(count >= this.maxActionsPerTick) {
            limitReached = true;
            break;
        }
    }

    this.isUpdating = false;

    let planCount = 0;
    let planBytes = 0;

    for(let i = 0; i < count; i++) {
        const bytes = getPlanSize(executedPlans[i]);

        planBytes += bytes;

        if(bytes === 0) {
            console.error("ActionType does not exist! Plan was not packed!");
        } else {
            planCount++;
        }
    }

    if(planCount !== 0) {
        const HEADER_SIZE = getGameUpdateHeaderSize(planCount);
        const TOTAL_BYTES = HEADER_SIZE + planBytes;
        const buffer = new ArrayBuffer(TOTAL_BYTES);
        const view = new DataView(buffer);

        view.setUint32(0, this.version++, true);
        view.setUint16(4, planCount, true);

        let offsetOffset = 6;
        let planWritePtr = HEADER_SIZE;
        let planOffset = 0;

        for(let i = 0; i < count; i++) {
            const bytes = getPlanSize(executedPlans[i]);

            //Skips invalid plans.
            if(bytes !== 0) {
                view.setUint16(offsetOffset, planOffset, true);
                
                writePlan(executedPlans[i], view, planWritePtr);
                planOffset += bytes;
                planWritePtr += bytes;
                offsetOffset += 2;
            }
        }

        if(planOffset !== planBytes) {
            console.error("Plan size mismatch!");
        }

        console.log("SENT BYTES:", TOTAL_BYTES);
        gameContext.sendGameUpdate(buffer);
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