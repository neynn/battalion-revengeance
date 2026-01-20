import { Action } from "../../../engine/action/action.js";
import { BattalionEntity } from "../../entity/battalionEntity.js";
import { TEAM_STAT, TRAIT_TYPE } from "../../enums.js";
import { createClientEntityObject, createServerEntityObject } from "../../systems/spawn.js";

export const PurchaseEntityAction = function(isServer) {
    Action.call(this);

    this.isServer = isServer;
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
    const { id, tileX, tileY, teamID, typeID, cost, morale } = data;
    const team = teamManager.getTeam(teamID);
    let entity = null;

    if(this.isServer) {
        entity = createServerEntityObject(gameContext, id, teamID, typeID, tileX, tileY);
    } else {
        entity = createClientEntityObject(gameContext, id, teamID, typeID, tileX, tileY);

        if(entity) {
            entity.playIdle(gameContext);
        }
    }

    if(entity) {
        //TODO: Apply morale.
        entity.setFlag(BattalionEntity.FLAG.HAS_FIRED);
    }

    team.reduceCash(cost);
    team.addStatistic(TEAM_STAT.UNITS_BUILT, 1);
    team.addStatistic(TEAM_STAT.RESOURCES_SPENT, cost);
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
    const team = teamManager.getTeam(teamID);
    
    if(!team || !building.isOwnedBy(teamID)) {
        return;
    }

    const entity = world.getEntityAt(tileX, tileY);

    if(entity !== null) {
        return;
    }

    const shopType = typeRegistry.getShopType(building.config.shop);
    const hasEntity = shopType.hasEntity(typeID);

    if(!hasEntity) {
        return;
    }

    const entityType = typeRegistry.getEntityType(typeID);
    const { cost } = entityType;

    //TODO: Cost amplifiers.
    if(!team.hasEnoughCash(cost)) {
        return;
    }

    //TODO: Add morale calculation.

    const entityID = entityManager.getNextID();

    executionPlan.setData({
        "id": entityID,
        "teamID": teamID,
        "tileX": tileX,
        "tileY": tileY,
        "typeID": typeID,
        "cost": cost,
        "morale": 0
    });
}