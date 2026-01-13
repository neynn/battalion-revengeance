import { Action } from "../../../engine/action/action.js";
import { TRAIT_TYPE } from "../../enums.js";

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
    const { world } = gameContext;
    const { turnManager } = world;
}

PurchaseEntityAction.prototype.fillExecutionPlan = function(gameContext, executionPlan, actionIntent) {
    const { world, teamManager } = gameContext;
    const { turnManager, mapManager } = world;
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

    //TODO: Get the spawn sheet and check for typeID
    //Get the cash from the sheet.
    //check if team.hasEnoughCash(cash)
    //Morale? Calculate and give to plan.

    executionPlan.setData({
        "tileX": tileX,
        "tileY": tileY,
        "typeID": typeID,
        "cost": 0,
        "morale": 0
    });
}