import { Objective } from "../objective/objective.js";
import { TypeRegistry } from "../typeRegistry.js";

export const Team = function(id) {
    this.id = id;
    this.allies = [];
    this.enemies = [];
    this.actors = [];
    this.entities = [];
    this.colorID = null;
    this.color = null;
    this.status = Team.STATUS.IDLE;
    this.objectives = [];
}

Team.STATUS = {
    IDLE: 0,
    WINNER: 1,
    LOSER: 2
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

Team.prototype.isLoser = function() {
    return this.status === Team.STATUS.LOSER;
}

Team.prototype.isWinner = function() {
    return this.status === Team.STATUS.WINNER;
}

Team.prototype.updateStatus = function() {
    if(this.status !== Team.STATUS.IDLE) {
        return;
    }

    if(this.entities.length === 0) {
        this.status = Team.STATUS.LOSER;
        return;
    }

    let objectivesWon = 0;

    for(let i = 0; i < this.objectives.length; i++) {
        const objective = this.objectives[i];
        const { status } = objective;

        switch(status) {
            case Objective.STATUS.SUCCESS: {
                objectivesWon++;
                break;
            }
            case Objective.STATUS.FAILURE: {
                this.status = Team.STATUS.LOSER;
                return;
            }
        }
    }

    const allObjectivesWon = objectivesWon !== 0 && this.objectives.length === objectivesWon;

    if(allObjectivesWon) {
        this.status = Team.STATUS.WINNER;
    }
}

Team.prototype.loadObjectives = function(teamObjectives, allObjectives) {
    for(const objectiveID of teamObjectives) {
        const config = allObjectives[objectiveID];

        if(config) {
            const { type } = config;
            
            if(TypeRegistry.OBJECTIVE_TYPE[type]) {
                this.objectives.push(config);
            }
        }
    }
}