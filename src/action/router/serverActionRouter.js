import { ActionRouter } from "../../../engine/action/actionRouter.js";
import { GAME_EVENT } from "../../enums.js";
import { getPlanSize, packPlan } from "../planPacker.js";

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

        const packed = packPlan(plan);

        if(packed) {
            executedPlans.push(packed);
            //executedPlans.push(plan);
        }

        count++;

        if(count >= this.maxActionsPerTick) {
            limitReached = true;
            break;
        }
    }

    this.isUpdating = false;

    if(executedPlans.length !== 0) {
        /*
        const count = executedPlans.length;
        let planBytes = 0;

        for(let i = 0; i < count; i++) {
            const bytes = getPlanSize(executedPlans[i]);

            planBytes += bytes;

            if(bytes === 0) {
                //Something went wrong...
            }
        }   

        const HEADER_SIZE = 4 + 2 + (2 * count);
        const TOTAL_BYTES = HEADER_SIZE + planBytes;
        const buffer = new ArrayBuffer(TOTAL_BYTES);
        const view = new DataView(buffer);

        view.setUint32(0, this.version++, true);
        view.setUint16(4, count, true);

        let offsetOffset = 6;
        let planOffset = HEADER_SIZE;

        for(let i = 0; i < count; i++) {
            const bytes = getPlanSize(executedPlans[i]);

            view.setUint16(offsetOffset, planOffset, true);
            //write plan into buffer...
            
            offsetOffset += 2;
            planOffset += bytes;
        }

        console.log("SENT BYTES:", TOTAL_BYTES);
        */
        gameContext.sendGameUpdate({
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