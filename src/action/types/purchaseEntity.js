import { Action } from "../../../engine/action/action.js";
import { EntityManager } from "../../../engine/entity/entityManager.js";
import { mapCategoryToStat } from "../../enumHelpers.js";
import { TEAM_STAT, TRAIT_TYPE } from "../../enums.js";
import { createEntitySnapshot } from "../../snapshot/entitySnapshot.js";
import { createUncloakIntent } from "../actionHelper.js";

export const PurchaseEntityAction = function(createEntity) {
    Action.call(this);

    this._createEntity = createEntity;
}

PurchaseEntityAction.createData = function() {
    return {
        "nextID": EntityManager.INVALID_ID,
        "cost": 0,
        "snapshot": createEntitySnapshot()
    }
}

PurchaseEntityAction.prototype = Object.create(Action.prototype);
PurchaseEntityAction.prototype.constructor = PurchaseEntityAction;

PurchaseEntityAction.prototype.isFinished = function(gameContext, executionPlan) {
    return true;
}

PurchaseEntityAction.prototype.onEnd = function(gameContext, data) {
    this.execute(gameContext, data);
}

PurchaseEntityAction.prototype.execute = function(gameContext, data) {
    const { teamManager } = gameContext;
    const { cost, nextID, snapshot } = data;
    const { teamID } = snapshot;
    const team = teamManager.getTeam(teamID);
    const entity = this._createEntity(gameContext, nextID, snapshot);

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

PurchaseEntityAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { world, teamManager, typeRegistry } = gameContext;
    const { turnManager, mapManager, entityManager } = world;
    const { tileX, tileY, typeID } = actionIntent;
    const worldMap = mapManager.getActiveMap();
    const building = worldMap.getBuilding(tileX, tileY);

    if(!building || !building.hasTrait(TRAIT_TYPE.SPAWNER)) {
        return;
    }

    const { currentActor } = turnManager;
    const { teamID } = currentActor;
    
    if(!building.isOwnedBy(teamID)) {
        return;
    }

    if(world.getEntityAt(tileX, tileY) !== null) {
        return;
    }

    const shopType = typeRegistry.getShopType(building.config.shop);
    const hasEntity = shopType.hasEntity(typeID);

    if(!hasEntity) {
        return;
    }

    const { health, cost } = typeRegistry.getEntityType(typeID);
    const team = teamManager.getTeam(teamID);
    const adjustedCost = team.getAdjustedCost(gameContext, cost);

    if(!team.hasEnoughCash(adjustedCost)) {
        return;
    }

    //TODO: Add morale calculation.
    const nextID = entityManager.getNextID();
    const data = PurchaseEntityAction.createData();

    data.nextID = nextID;
    data.cost = adjustedCost;
    data.snapshot.tileX = tileX;
    data.snapshot.tileY = tileY;
    data.snapshot.type = typeID;
    data.snapshot.health = health;
    data.snapshot.maxHealth = health;
    data.snapshot.teamID = teamID;

    executionPlan.addNext(createUncloakIntent(nextID));
    executionPlan.setData(data);
}