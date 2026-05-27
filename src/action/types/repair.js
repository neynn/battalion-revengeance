import { Action } from "../../../engine/action/action.js";
import { ActionIntent } from "../../../engine/action/actionIntent.js";
import { FIXED_DELTA_TIME } from "../../../engine/engine_constants.js";
import { EntityManager } from "../../../engine/entity/entityManager.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";
import { ACTION_TYPE, HEAL_COMMAND_TYPE, SOUND_TYPE, TEAM_STAT, TRAIT_TYPE } from "../../enums.js";
import { playEntitySound } from "../../systems/sound.js";
import { getAnimationDuration, playHealEffect, updateEntitySprite } from "../../systems/sprite.js";
import { createEntityResolution, getDeadEntities, InteractionResolver } from "../interactionResolver.js";
import { DeathActionVTable } from "./death.js";

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

    if(!entity || entity.isDead() || !entity.isAllowedToActAndMove() || entity.hasFlag(BattalionEntity.FLAG.IS_REPAIRING)) {
        return;
    }

    //Disbles healing if the entity is at full health.
    if(entity.getVitality() >= 1) {
        return;
    }

    const team = entity.getTeam(gameContext);
    const entityCost = team.getRegularCost(gameContext, entity.config.cost);
    const healPercentage = entity.getHealPercentage();
    const finalCost = healPercentage * entityCost;

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
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, cost } = data;
    const entity = entityManager.getEntity(entityID);

    playEntitySound(gameContext, entity, SOUND_TYPE.HEAL);
}