import { TurnActor } from "../../engine/world/turn/turnActor.js";
import { ActionHelper } from "../action/actionHelper.js";

export const BattalionActor = function(id) {
    TurnActor.call(this, id);

    this.name = "";
    this.teamID = null;
    this.commander = null;
}

BattalionActor.prototype = Object.create(TurnActor.prototype);
BattalionActor.prototype.constructor = BattalionActor;

BattalionActor.prototype.setName = function(name) {
    this.name = name;
}

BattalionActor.prototype.isControlling = function(entity) {
    return entity.teamID !== null && this.teamID === entity.teamID;
}

BattalionActor.prototype.surrender = function(gameContext) {
    const { teamManager } = gameContext;
    const team = teamManager.getTeam(this.teamID);
    
    if(team) {
        const { entities } = team;
        const deathRequest = ActionHelper.createDeathRequest(gameContext, entities);

        this.addIntent(deathRequest);
    }
}

BattalionActor.prototype.setTeam = function(teamID) {
    this.teamID = teamID;
}

BattalionActor.prototype.onTurnStart = function(gameContext) {
    const { teamManager } = gameContext;

    //Only register after turn 1. TODO
    if(this.turn > 1) {
        const team = teamManager.getTeam(this.teamID);

        if(team) {
            team.onTurnStart(gameContext, this.turn);
        }
    }
}

BattalionActor.prototype.onTurnEnd = function(gameContext) {
    const { teamManager } = gameContext;
    const team = teamManager.getTeam(this.teamID);

    if(team) {
        team.onTurnEnd(gameContext, this.turn);
    }
}

BattalionActor.prototype.activeUpdate = function(gameContext) {}

BattalionActor.prototype.loadCommander = function(gameContext, typeID) {
    const { typeRegistry } = gameContext;
    const commanderType = typeRegistry.getCommanderType(typeID);

    this.commander = commanderType;
}