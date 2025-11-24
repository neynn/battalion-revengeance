import { Actor } from "../../engine/turn/actor.js";
import { ActionHelper } from "../action/actionHelper.js";

export const BattalionActor = function(id) {
    Actor.call(this, id);

    this.teamID = null;
    this.portrait = null;
    this.commander = null;
}

BattalionActor.prototype = Object.create(Actor.prototype);
BattalionActor.prototype.constructor = BattalionActor;

BattalionActor.prototype.isControlling = function(entity) {
    return entity.teamID !== null && this.teamID === entity.teamID;
}

BattalionActor.prototype.surrender = function(gameContext) {
    const { teamManager } = gameContext;
    const team = teamManager.getTeam(this.teamID);
    
    if(team) {
        const { entities } = team;
        const deathRequest = ActionHelper.createDeathRequest(gameContext, entities);

        this.queueRequest(deathRequest);
    }
}

BattalionActor.prototype.drawPortrait = function(context, drawX, drawY) {
    if(this.portrait && this.portrait.bitmap) {
        context.drawImage(this.portrait.bitmap, drawX, drawY);
    }
}

BattalionActor.prototype.setTeam = function(teamID) {
    this.teamID = teamID;
}

BattalionActor.prototype.onTurnStart = function(gameContext) {
    const { teamManager, world } = gameContext;
    const { turnManager } = world;
    const globalTurn = turnManager.getGlobalTurn();

    if(globalTurn <= 1) {
        return;
    }

    const team = teamManager.getTeam(this.teamID);

    if(team) {
        team.onTurnStart(gameContext, this.turn);
    }
}

BattalionActor.prototype.onTurnEnd = function(gameContext) {
    const { teamManager } = gameContext;
    const team = teamManager.getTeam(this.teamID);

    if(team) {
        team.onTurnEnd(gameContext, this.turn);
    }
}

BattalionActor.prototype.activeUpdate = function(gameContext, remainingActions) {
    this.requestTurnEnd();
}

BattalionActor.prototype.loadCommander = function(gameContext, typeID) {
    const { portraitHandler, typeRegistry } = gameContext;
    const commanderType = typeRegistry.getCommanderType(typeID);
    const { portrait } = commanderType;

    this.commander = commanderType;
    this.portrait = portraitHandler.getPortraitTexture(portrait); 
}