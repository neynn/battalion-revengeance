import { Action } from "../../../engine/action/action.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";
import { mapCategoryToStat } from "../../enumHelpers.js";
import { TEAM_STAT, TRAIT_TYPE } from "../../enums.js";
import { createClientEntityObject, createServerEntityObject } from "../../systems/spawn.js";
import { createMineTriggerIntent, createUncloakIntent } from "../actionHelper.js";

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
    const { entityManager } = world;
    const { id, entityID, tileX, tileY, typeID, cost, morale } = data;
    const spawnerEntity = entityManager.getEntity(entityID);
    const team = spawnerEntity.getTeam(gameContext);
    const teamID = team.getID();
    let entity = null;

    if(this.isServer) {
        entity = createServerEntityObject(gameContext, id, teamID, typeID, tileX, tileY);
    } else {
        entity = createClientEntityObject(gameContext, id, teamID, typeID, tileX, tileY);

        if(entity) {
            entity.playIdle(gameContext);
        }
    }

    if(!entity) {
        console.error("Critical Error: Entity could not be spawned!");
        return;
    }

    //TODO: Apply morale

    entity.setPurchased();
    spawnerEntity.setFlag(BattalionEntity.FLAG.HAS_FIRED);
    spawnerEntity.reduceCash(cost);
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

    if(!entity || entity.isDead() || !entity.canAct() || !entity.hasTrait(TRAIT_TYPE.TANK_POOPER)) {
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

    executionPlan.addNext(createMineTriggerIntent(nextID));

    executionPlan.addNext(createUncloakIntent(nextID));

    executionPlan.setData({
        "id": nextID,
        "entityID": entityID,
        "tileX": x,
        "tileY": y,
        "typeID": typeID,
        "cost": adjustedCost,
        "morale": 0
    });
}