import { Action } from "../../../engine/action/action.js";
import { EntityManager } from "../../../engine/entity/entityManager.js";
import { mapCategoryToStat } from "../../enumHelpers.js";
import { TEAM_STAT, TRAIT_TYPE } from "../../enums.js";
import { createEntitySnapshot } from "../../snapshot/entitySnapshot.js";
import { DIRECTION_DELTA_X, DIRECTION_DELTA_Y, isDirectionValid } from "../../systems/direction.js";
import { createUncloakIntent } from "../actionHelper.js";
import { MineTriggerVTable } from "./mineTrigger.js";

export const ProduceEntityAction = function(createEntity) {
    Action.call(this);

    this._createEntity = createEntity;
}

ProduceEntityAction.createData = function() {
    return {
        "entityID": EntityManager.INVALID_ID,
        "cost": 0,
        "nextID": EntityManager.INVALID_ID,
        "snapshot": createEntitySnapshot()
    }
}

ProduceEntityAction.prototype = Object.create(Action.prototype);
ProduceEntityAction.prototype.constructor = ProduceEntityAction;

ProduceEntityAction.prototype.execute = function(gameContext, data) {
    const { world, teamManager } = gameContext;
    const { entityManager } = world;
    const { entityID, cost, nextID, snapshot } = data;
    const { teamID } = snapshot;
    const team = teamManager.getTeam(teamID);
    const spawnerEntity = entityManager.getEntity(entityID);
    const entity = this._createEntity(gameContext, nextID, snapshot);

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

    if(!entity || entity.isDead() || !entity.canActAndMove() || !entity.hasTrait(TRAIT_TYPE.TANK_POOPER) || !isDirectionValid(direction)) {
        return;
    }

    const { health, cost, movementType } = typeRegistry.getEntityType(typeID);
    const tileX = entity.tileX + DIRECTION_DELTA_X[direction];
    const tileY = entity.tileY + DIRECTION_DELTA_Y[direction];
    const tileType = worldMap.getTileType(gameContext, tileX, tileY);

    //If the entity cannot move to a tile, it should not spawn there.
    if(tileType.getPassabilityCost(movementType) <= 0) {
        return;
    }

    if(world.getEntityAt(tileX, tileY) !== null) {
        return;
    }

    const team = entity.getTeam(gameContext);
    const adjustedCost = team.getAdjustedCost(gameContext, cost);

    //Entities purchase produced units, not the team.
    if(!entity.canPurchase(gameContext, typeID, adjustedCost)) {
        return;
    }

    //TODO: Add morale calculation.
    const nextID = entityManager.getNextID();
    const data = ProduceEntityAction.createData();

    data.entityID = entityID;
    data.nextID = nextID;
    data.cost = cost;
    data.snapshot.tileX = tileX;
    data.snapshot.tileY = tileY;
    data.snapshot.type = typeID;
    data.snapshot.health = health;
    data.snapshot.maxHealth = health;
    data.snapshot.teamID = team.getID();

    executionPlan.addNext(MineTriggerVTable.createIntent(nextID));
    executionPlan.addNext(createUncloakIntent(nextID));
    executionPlan.setData(data);
}