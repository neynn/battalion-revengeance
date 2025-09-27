import { TypeRegistry } from "../typeRegistry.js";

export const Team = function(id) {
    this.id = id;
    this.allies = [];
    this.enemies = [];
    this.actors = [];
    this.entities = [];
    this.colorID = null;
    this.color = null;
    this.status = Team.STATUS.ALIVE;
}

Team.STATUS = {
    ALIVE: 0,
    DEFEATED: 1,
    SPECTATING: 2
};

Team.prototype.getID = function() {
    return this.id;
}

Team.prototype.hasEntity = function(entityID) {
    for(let i = 0; i < this.entities.length; i++) {
        if(this.entities[i] === entityID) {
            return true;
        }
    }

    return false;
}

Team.prototype.addEntity = function(entityID) {
    const hasEntity = this.hasEntity(entityID);

    if(!hasEntity) {
        this.entities.push(entityID);
    }
}

Team.prototype.removeEntity = function(entityID) {
    for(let i = 0; i < this.entities.length; i++) {
        if(this.entities[i] === entityID) {
            this.entities[i] = this.entities[this.entities.length - 1];
            this.entities.pop();
            return;
        }
    }
}

Team.prototype.addActor = function(actorID) {
    for(let i = 0; i < this.actors.length; i++) {
        if(this.actors[i] === actorID) {
            return;
        }
    }

    this.actors.push(actorID);
}

Team.prototype.setCustomColor = function(color) {
    this.colorID = "CUSTOM_" + this.id;
    this.color = color;
}

Team.prototype.setColor = function(gameContext, colorID) {
    const { typeRegistry } = gameContext;
    const color = typeRegistry.getType(colorID, TypeRegistry.CATEGORY.SCHEMA);

    this.colorID = colorID;
    this.color = color;
}

Team.prototype.isEnemy = function(teamID) {
    for(let i = 0; i < this.enemies.length; i++) {
        if(this.enemies[i] === teamID) {
            return true;
        }
    }

    return false;
}

Team.prototype.isAlly = function(teamID) {
    for(let i = 0; i < this.allies.length; i++) {
        if(this.allies[i] === teamID) {
            return true;
        }
    }
    
    return false;
}

Team.prototype.isDefeated = function() {
    return this.status === Team.STATUS.DEFEATED;
}

Team.prototype.updateStatus = function() {
    if(this.entities.length === 0) {
        this.status = Team.STATUS.DEFEATED;
    } else {
        this.status = Team.STATUS.ALIVE;
    }

    return this.status;
}