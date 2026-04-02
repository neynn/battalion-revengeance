import { ActionRouter } from "../../../engine/action/actionRouter.js";
import { ACTION_TYPE, GAME_EVENT } from "../../enums.js";
import { 
    packAttackPlan,
    packCapturePlan,
    packCloakPlan,
    packDeathPlan,
    packEndTurnPlan,
    packEntitySpawnPlan,
    packExplodeTilePlan,
    packExtractOrePlan,
    packHealPlan, packMineTriggerPlan, 
    packMovePlan,
    packProducePlan,
    packPurchasePlan,
    packStartTurnPlan,
    packUncloakPlan
} from "../planPacker.js";

export const ServerActionRouter = function() {
    ActionRouter.call(this);

    this.maxActionsPerTick = 1000;
    this.isUpdating = false;
    this.version = 0;
}

ServerActionRouter.prototype = Object.create(ActionRouter.prototype);
ServerActionRouter.prototype.constructor = ServerActionRouter;

ServerActionRouter.prototype.packPlan = function(plan) {
    const { id, type, data } = plan;

    switch(type) {
        case ACTION_TYPE.ATTACK: return packAttackPlan(data);
        case ACTION_TYPE.CAPTURE: return packCapturePlan(data);
        case ACTION_TYPE.CLOAK: return packCloakPlan(data);
        case ACTION_TYPE.DEATH: return packDeathPlan(data);
        case ACTION_TYPE.END_TURN: return packEndTurnPlan(data);
        case ACTION_TYPE.ENTITY_SPAWN: return packEntitySpawnPlan(data);
        case ACTION_TYPE.EXPLODE_TILE: return packExplodeTilePlan(data);
        case ACTION_TYPE.EXTRACT: return packExtractOrePlan(data);
        case ACTION_TYPE.HEAL: return packHealPlan(data);
        case ACTION_TYPE.MINE_TRIGGER: return packMineTriggerPlan(data);
        case ACTION_TYPE.MOVE: return packMovePlan(data);
        case ACTION_TYPE.PRODUCE_ENTITY: return packProducePlan(data);
        case ACTION_TYPE.PURCHASE_ENTITY: return packPurchasePlan(data);
        case ACTION_TYPE.START_TURN: return packStartTurnPlan(data);
        case ACTION_TYPE.UNCLOAK: return packUncloakPlan(data);
        default: return null;
    }
}

ServerActionRouter.prototype.updateActionQueue = function(gameContext) {
    if(this.isUpdating) {
        return;
    }

    const { world } = gameContext;
    const { actionQueue, eventHandler } = world;
    const executedPlans = [];
    let count = 0;
    let sentBytes = 0;

    this.isUpdating = true;

    while(count < this.maxActionsPerTick && actionQueue.isRunning()) {
        const plan = actionQueue.mpFlushPlan(gameContext);

        if(plan === null) {
            break;
        }

        const packed = this.packPlan(plan);

        if(packed) {
            sentBytes += packed.byteLength;
            executedPlans.push(packed);
        }

        count++;
    }

    this.isUpdating = false;

    if(executedPlans.length !== 0 || eventHandler.lastRecentlyTriggered.length !== 0) {
        gameContext.broadcast(GAME_EVENT.MP_SERVER_UPDATE, {
            "version": this.version++,
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