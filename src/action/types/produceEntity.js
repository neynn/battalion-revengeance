import { Action } from "../../../engine/action/action.js";
import { TRAIT_TYPE } from "../../enums.js";

export const ProduceEntityAction = function(isServer) {
    Action.call(this);

    this.isServer = isServer;
}

ProduceEntityAction.prototype = Object.create(Action.prototype);
ProduceEntityAction.prototype.constructor = ProduceEntityAction;

ProduceEntityAction.prototype.isFinished = function(gameContext, executionPlan) {
    return true;
}

ProduceEntityAction.prototype.onEnd = function(gameContext, data) {
    this.execute(gameContext, data);
}

ProduceEntityAction.prototype.execute = function(gameContext, data) {
    const { world } = gameContext;
    const { turnManager } = world;
}

ProduceEntityAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { turnManager, mapManager, entityManager } = world;
    const { entityID, typeID, direction } = actionIntent;
    const entity = entityManager.getEntity(entityID);

    if(!entity || entity.isDead() || !entity.canAct() || !entity.hasTrait(TRAIT_TYPE.TANK_POOPER)) {
        return;
    }

    executionPlan.setData({
        
    });
}