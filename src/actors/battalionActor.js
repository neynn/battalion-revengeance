import { Actor } from "../../engine/turn/actor.js";
import { ActionHelper } from "../action/actionHelper.js";

export const BattalionActor = function(id) {
    Actor.call(this, id);

    this.entities = [];
    this.teamID = null;
    this.portrait = null;
    this.customID = null;
    this.commander = null;
}

BattalionActor.prototype = Object.create(Actor.prototype);
BattalionActor.prototype.constructor = BattalionActor;

BattalionActor.prototype.surrender = function(gameContext) {
    const deathRequest = ActionHelper.createDeathRequest(gameContext, this.entities);

    this.queueRequest(deathRequest);
}

BattalionActor.prototype.setCustomID = function(id) {
    this.customID = id;
}

BattalionActor.prototype.drawPortrait = function(context, drawX, drawY) {
    if(this.portrait && this.portrait.bitmap) {
        context.drawImage(this.portrait.bitmap, drawX, drawY);
    }
}

BattalionActor.prototype.setTeam = function(teamID) {
    this.teamID = teamID;
}

BattalionActor.prototype.addEntity = function(entityID) {
    if(!this.hasEntity(entityID)) {
        this.entities.push(entityID);
    }
}

BattalionActor.prototype.removeEntity = function(entityID) {
    for(let i = 0; i < this.entities.length; i++) {
        if(this.entities[i] === entityID) {
            this.entities[i] = this.entities[this.entities.length - 1];
            this.entities.pop();
            return;
        }
    }
}

BattalionActor.prototype.hasEntity = function(entityID) {
    for(let i = 0; i < this.entities.length; i++) {
        if(this.entities[i] === entityID) {
            return true;
        }
    }

    return false;
}

BattalionActor.prototype.onTurnStart = function(gameContext) {
    const { world } = gameContext;
    const { entityManager } = world;

    for(const entityID of this.entities) {
        const entity = entityManager.getEntity(entityID);

        if(entity) {
            entity.onTurnStart(gameContext);
        }
    }
}

BattalionActor.prototype.onTurnEnd = function(gameContext) {
    const { world, teamManager } = gameContext;
    const { entityManager } = world;

    for(const entityID of this.entities) {
        const entity = entityManager.getEntity(entityID);

        if(entity) {
            entity.onTurnEnd(gameContext);
        }
    }

    teamManager.onTurnEnd(gameContext, this.teamID, this.turn);
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