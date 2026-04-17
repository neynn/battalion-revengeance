import { Actor } from "../../engine/world/actor/actor.js";
import { TeamManager } from "../team/teamManager.js";

export const BattalionActor = function(id) {
    Actor.call(this, id);

    this.teamID = TeamManager.INVALID_ID;
    this.actionIntents = [];
    this.maxIntents = 0;
}

BattalionActor.prototype = Object.create(Actor.prototype);
BattalionActor.prototype.constructor = BattalionActor;

BattalionActor.prototype.getTeam = function(gameContext) {
    const { teamManager } = gameContext;

    return teamManager.getTeam(this.teamID);
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

BattalionActor.prototype.clearIntents = function() {
    this.actionIntents.length = 0;
}

BattalionActor.prototype.addIntent = function(intent) {
    if(this.actionIntents.length < this.maxIntents) {
        this.actionIntents.push(intent);
    }
}

BattalionActor.prototype.enqueueNextIntent = function(gameContext) {
    const { world, actionRouter, teamManager } = gameContext;
    const { actionQueue } = world;

    if(!teamManager.isCurrent(this.teamID) || actionQueue.isRunning()) {
        return;
    }

    let toDelete = this.actionIntents.length;

    for(let i = 0; i < this.actionIntents.length; i++) {
        const actionIntent = this.actionIntents[i];
        const executionPlan = actionQueue.createExecutionPlan(gameContext, actionIntent);

        if(executionPlan) {
            actionRouter.dispatch(gameContext, executionPlan, actionIntent);
            toDelete = i + 1;
            break;
        }
    }

    if(toDelete === this.actionIntents.length) {
        this.actionIntents.length = 0;
    } else {
        this.actionIntents.splice(0, toDelete);
    }
}