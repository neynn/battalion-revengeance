import { TurnActor } from "../../engine/world/turn/turnActor.js";
import { createDeathIntent } from "../action/actionHelper.js";
import { TeamManager } from "../team/teamManager.js";

export const BattalionActor = function(id) {
    TurnActor.call(this, id);

    this.name = "";
    this.teamID = TeamManager.INVALID_ID;
}

BattalionActor.prototype = Object.create(TurnActor.prototype);
BattalionActor.prototype.constructor = BattalionActor;

BattalionActor.prototype.getTeam = function(gameContext) {
    const { teamManager } = gameContext;

    return teamManager.getTeam(this.teamID);
}

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
        const deathRequest = createDeathIntent(entities);

        this.addIntent(deathRequest);
    }
}

BattalionActor.prototype.setTeam = function(teamID) {
    this.teamID = teamID;
}

BattalionActor.prototype.getVisibleEntity = function(gameContext, tileX, tileY) {
    const { world } = gameContext;
    const entity = world.getEntityAt(tileX, tileY);

    if(!entity) {
        return null;
    }

    if(this.teamID === TeamManager.INVALID_ID || entity.isVisibleTo(gameContext, this.teamID)) {
        return entity;
    }

    return null;
}