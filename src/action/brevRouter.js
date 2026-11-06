import { EventEmitter } from "../../engine/events/eventEmitter.js";
import { MP_CLIENT_JSON, MP_SERVER_BINARY } from "../enums.js";
import { packIntent } from "./intentPacker.js";
import { GAME_UPDATE_HEADER_SIZE, getGameUpdateHeaderSize } from "./packer_constants.js";
import { getPlanSize, writePlan } from "./planPacker.js";

export const BrevRouter = function() {
    this.isMultiplayer = false;
    this.isAuthority = false;

    this.maxActionsPerTick = 1000;
    this.isUpdating = false;
    this.version = 0;

    this.events = new EventEmitter();
    this.events.register(BrevRouter.EVENT.MP_SEND_BUFFER);
}

BrevRouter.EVENT = {
    MP_SEND_BUFFER: 0
};

BrevRouter.prototype.toSingleplayer = function() {
    this.isMultiplayer = false;
    this.isAuthority = true;
}

BrevRouter.prototype.toMultiplayerServer = function() {
    this.isMultiplayer = true;
    this.isAuthority = true;
}

BrevRouter.prototype.toMultiplayerClient = function() {
    this.isMultiplayer = true;
    this.isAuthority = false;
}

BrevRouter.prototype.mpUpdateActionQueue = function(gameContext) {
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

        view.setUint8(0, MP_SERVER_BINARY.GAME_UPDATE);
        view.setUint32(1, this.version++, true);
        view.setUint16(5, planCount, true);

        let offsetOffset = GAME_UPDATE_HEADER_SIZE;
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

        this.events.emit(BrevRouter.EVENT.MP_SEND_BUFFER, {
            "bytes": TOTAL_BYTES,
            "buffer": buffer
        });
    }
}

BrevRouter.prototype.pushIntent = function(gameContext, actionIntent, isFromTrigger = false) {
    const { world } = gameContext;
    const { actionQueue } = world;
    let isSuccessful = false;

    if(!this.isMultiplayer) {
        const executionPlan = actionQueue.createExecutionPlan(gameContext, actionIntent);

        if(executionPlan) {
            actionQueue.enqueue(executionPlan);
            isSuccessful = true;
        }
    } else {
        if(this.isAuthority) {
            const executionPlan = actionQueue.createExecutionPlan(gameContext, actionIntent);

            if(executionPlan) {
                actionQueue.enqueue(executionPlan);
                isSuccessful = true;
            }

            this.mpUpdateActionQueue(gameContext);
        } else {
            //In a multiplayer setting, the client is not allowed to trigger based intents.
            if(!isFromTrigger) {
                const { client } = gameContext;
                const { socket } = client;
                const packed = packIntent(actionIntent);

                if(packed) {
                    socket.messageRoom(MP_CLIENT_JSON.ACTION_INTENT, packed);
                    isSuccessful = true;
                } else {
                    console.log("Unsupported ActionType!");
                }
            }
        }
    }

    return isSuccessful;
}