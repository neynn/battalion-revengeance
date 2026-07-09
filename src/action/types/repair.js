import { Action } from "../../../engine/action/action.js";
import { ActionIntent } from "../../../engine/action/actionIntent.js";
import { EntityManager } from "../../../engine/entity/entityManager.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";
import { ACTION_TYPE, SOUND_TYPE, TEAM_STAT, TRAIT_TYPE } from "../../enums.js";

const createRepairIntent = function(entityID) {
    return new ActionIntent(ACTION_TYPE.REPAIR, {
        "entityID": entityID
    });
}

const createRepairData = function() {
    return {
        "entityID": EntityManager.INVALID_ID,
        "cost": 0
    }
}

const fillRepairPlan = function(gameContext, executionPlan, actionIntent) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID } = actionIntent;
    const entity = entityManager.getEntity(entityID);

    if(!entity || entity.isDead() || !entity.isAllowedToActAndMove()) {
        return;
    }

    if(entity.hasFlag(BattalionEntity.FLAG.IS_REPAIRING) || entity.hasTrait(TRAIT_TYPE.IRREPARABLE)) {
        return;
    }

    //Disbles healing if the entity is at full health.
    if(entity.getVitality() >= 1) {
        return;
    }

    const team = entity.getTeam(gameContext);
    const entityCost = team.getRegularCost(gameContext, entity.config.cost);
    const healPercentage = entity.getHealPercentage();
    const finalCost = Math.floor(healPercentage * entityCost);

    if(!team.hasEnoughCash(finalCost)) {
        return;
    }

    const data = createRepairData();

    data.entityID = entityID;
    data.cost = finalCost;

    executionPlan.setData(data);
}

const executeRepair = function(gameContext, data) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, cost } = data;
    const entity = entityManager.getEntity(entityID);
    const team = entity.getTeam(gameContext);

    entity.setFlag(BattalionEntity.FLAG.IS_REPAIRING);
    entity.consumeAct();
    entity.reduceMorale();
    team.reduceCash(cost);
    team.addStatistic(TEAM_STAT.RESOURCES_SPENT, cost);
}

export const RepairVTable = {
    createIntent: createRepairIntent,
    createData: createRepairData,
    fillPlan: fillRepairPlan,
    execute: executeRepair
};

export const RepairAction = function() {
    Action.call(this);
}

RepairAction.prototype = Object.create(Action.prototype);
RepairAction.prototype.constructor = RepairAction;

RepairAction.prototype.onStart = function(gameContext, data) {
    const { world, soundController } = gameContext;
    const { entityManager } = world;
    const { entityID, cost } = data;
    const entity = entityManager.getEntity(entityID);

    soundController.playUnitSound(gameContext, entity, SOUND_TYPE.HEAL);
}