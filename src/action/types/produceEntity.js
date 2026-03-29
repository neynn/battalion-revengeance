import { Action } from "../../../engine/action/action.js";
import { mapCategoryToStat } from "../../enumHelpers.js";
import { TEAM_STAT, TRAIT_TYPE } from "../../enums.js";
import { createEntitySnapshot } from "../../snapshot/entitySnapshot.js";
import { createMineTriggerIntent, createUncloakIntent } from "../actionHelper.js";

export const ProduceEntityAction = function(createEntity) {
    Action.call(this);

    this._createEntity = createEntity;
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
    const { world, teamManager } = gameContext;
    const { entityManager } = world;
    const { entityID, cost, id, snapshot } = data;
    const { tileX, tileY, type, teamID, morale } = snapshot;
    const team = teamManager.getTeam(teamID);
    const spawnerEntity = entityManager.getEntity(entityID);
    const entity = this._createEntity(gameContext, id, teamID, type, tileX, tileY);

    if(!entity) {
        console.error("Critical Error: Entity could not be spawned!");
        return;
    }

    //TODO: Apply morale
    entity.setPurchased();
    spawnerEntity.reduceCash(cost);
    spawnerEntity.setActed();
    team.addStatistic(TEAM_STAT.UNITS_BUILT, 1);
    team.addStatistic(TEAM_STAT.RESOURCES_SPENT, cost);
    team.addStatistic(mapCategoryToStat(entity.config.category), 1);
}

ProduceEntityAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { world, typeRegistry } = gameContext;
    const { entityManager, mapManager } = world;
    const { entityID, typeID, direction } = actionIntent;
    const entity = entityManager.getEntity(entityID);
    const worldMap = mapManager.getActiveMap();

    if(!entity || entity.isDead() || !entity.canActAndMove() || !entity.hasTrait(TRAIT_TYPE.TANK_POOPER)) {
        return;
    }

    const { cost, movementType } = typeRegistry.getEntityType(typeID);
    const { x, y } = entity.getTileByDirection(direction);
    const tileType = worldMap.getTileType(gameContext, x, y);

    //If the entity cannot move to a tile, it should not spawn there.
    if(tileType.getPassabilityCost(movementType) <= 0) {
        return;
    }

    if(world.getEntityAt(x, y) !== null) {
        return;
    }

    const team = entity.getTeam(gameContext);
    const adjustedCost = team.getAdjustedCost(cost);

    //Entities purchase produced units, not the team.
    if(!entity.canPurchase(gameContext, typeID, adjustedCost)) {
        return;
    }

    //TODO: Add morale calculation.
    const nextID = entityManager.getNextID();
    const snapshot = createEntitySnapshot();

    snapshot.tileX = x;
    snapshot.tileY = y;
    snapshot.type = typeID;
    snapshot.teamID = team.getID();

    executionPlan.addNext(createMineTriggerIntent(nextID));
    executionPlan.addNext(createUncloakIntent(nextID));

    executionPlan.setData({
        "entityID": entityID,
        "cost": adjustedCost,
        "id": nextID,
        "snapshot": snapshot
    });
}