import { Action } from "../../../engine/action/action.js";
import { ActionIntent } from "../../../engine/action/actionIntent.js";
import { EntityManager } from "../../../engine/entity/entityManager.js";
import { mapCategoryToStat } from "../../enumHelpers.js";
import { ACTION_TYPE, TEAM_STAT, TRAIT_TYPE } from "../../enums.js";
import { createEntitySnapshot } from "../../snapshot/entitySnapshot.js";
import { createClientEntityObject, createServerEntityObject } from "../../systems/spawn.js";
import { UncloakVTable } from "./uncloak.js";

const createPurchaseIntent = function(tileX, tileY, typeID) {
    return new ActionIntent(ACTION_TYPE.PURCHASE_ENTITY, {
        "tileX": tileX,
        "tileY": tileY,
        "typeID": typeID
    });
}

const createPurchaseData = function() {
    return {
        "nextID": EntityManager.INVALID_ID,
        "cost": 0,
        "snapshot": createEntitySnapshot()
    }
}

const fillPurchasePlan = function(gameContext, executionPlan, actionIntent) {
    const { world, teamManager, typeRegistry } = gameContext;
    const { mapManager, entityManager } = world;
    const { tileX, tileY, typeID } = actionIntent;
    const { currentTeam } = teamManager;
    const worldMap = mapManager.getActiveMap();
    const building = worldMap.getBuilding(tileX, tileY);

    if(!building || !building.belongsTo(currentTeam) || !building.hasTrait(TRAIT_TYPE.SPAWNER)) {
        return;
    }

    if(world.getEntityAt(tileX, tileY) !== null) {
        return;
    }

    const shopType = building.getShop(gameContext);
    const hasEntity = shopType.hasEntity(typeID);

    if(!hasEntity) {
        return;
    }

    const { health, cost } = typeRegistry.getEntityType(typeID);
    const team = teamManager.getTeam(currentTeam);
    const adjustedCost = team.getAdjustedCost(gameContext, cost);

    if(!team.hasEnoughCash(adjustedCost)) {
        return;
    }

    //TODO: Add morale calculation.
    const nextID = entityManager.getNextID();
    const data = createPurchaseData();

    data.nextID = nextID;
    data.cost = adjustedCost;
    data.snapshot.tileX = tileX;
    data.snapshot.tileY = tileY;
    data.snapshot.type = typeID;
    data.snapshot.health = health;
    data.snapshot.maxHealth = health;
    data.snapshot.teamID = currentTeam;

    executionPlan.addNext(UncloakVTable.createIntent(nextID));
    executionPlan.setData(data);
}

const executePurchase = function(gameContext, data) {
    const { teamManager, isClient } = gameContext;
    const { cost, nextID, snapshot } = data;
    const { teamID } = snapshot;
    const team = teamManager.getTeam(teamID);
    let entity = null;

    if(isClient) {
        entity = createClientEntityObject(gameContext, nextID, snapshot);
    } else {
        entity = createServerEntityObject(gameContext, nextID, snapshot);
    }

    if(!entity) {
        console.error("Critical Error: Entity could not be spawned!");
        return;
    }

    //TODO: Apply morale
    entity.setPurchased();
    team.reduceCash(cost);
    team.addStatistic(TEAM_STAT.UNITS_BUILT, 1);
    team.addStatistic(TEAM_STAT.RESOURCES_SPENT, cost);
    team.addStatistic(mapCategoryToStat(entity.config.category), 1);
}

export const PurchaseVTable = {
    createIntent: createPurchaseIntent,
    createData: createPurchaseData,
    fillPlan: fillPurchasePlan,
    execute: executePurchase
};

export const PurchaseEntityAction = function() {
    Action.call(this);
}

PurchaseEntityAction.prototype = Object.create(Action.prototype);
PurchaseEntityAction.prototype.constructor = PurchaseEntityAction;