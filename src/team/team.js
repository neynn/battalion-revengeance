import { Objective } from "../objective/objective.js";
import { CaptureObjective } from "../objective/types/capture.js";
import { DefeatObjective } from "../objective/types/defeat.js";
import { DefendObjective } from "../objective/types/defend.js";
import { ProtectObjective } from "../objective/types/protect.js";
import { SurviveObjective } from "../objective/types/survive.js";
import { TimeLimitObjective } from "../objective/types/timeLimit.js";
import { TypeRegistry } from "../type/typeRegistry.js";

export const Team = function(id) {
    this.id = id;
    this.allies = [];
    this.enemies = [];
    this.entities = [];
    this.actor = null;
    this.colorID = null;
    this.color = null;
    this.status = Team.STATUS.IDLE;
    this.objectives = [
        new ProtectObjective(),
        new DefeatObjective(),
        new CaptureObjective(),
        new DefendObjective(),
        new TimeLimitObjective(),
        new SurviveObjective()
    ];
}

Team.OBJECTIVE_SLOT = {
    [TypeRegistry.OBJECTIVE_TYPE.PROTECT]: 0,
    [TypeRegistry.OBJECTIVE_TYPE.DEFEAT]: 1,
    [TypeRegistry.OBJECTIVE_TYPE.CAPTURE]: 2,
    [TypeRegistry.OBJECTIVE_TYPE.DEFEND]: 3,
    [TypeRegistry.OBJECTIVE_TYPE.TIME_LIMIT]: 4,
    [TypeRegistry.OBJECTIVE_TYPE.SURVIVE]: 5
};

Team.STATUS = {
    IDLE: 0,
    WINNER: 1,
    LOSER: 2
};

Team.prototype.hasActor = function() {
    return this.actor !== null
}

Team.prototype.setActor = function(actorID) {
    this.actor = actorID;
}

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
        return this.status;
    }

    if(this.entities.length === 0) {
        this.status = Team.STATUS.LOSER;

        return this.status;
    }

    let objectivesWon = 0;
    let necessaryObjectives = 0;

    for(let i = 0; i < this.objectives.length; i++) {
        const objective = this.objectives[i];
        const { status, targets } = objective;

        if(targets.length > 0) {
            switch(status) {
                case Objective.STATUS.IDLE: {
                    objectivesWon += objective.allTargetsComplete() ? 1 : 0;
                    break;
                }
                case Objective.STATUS.FAILURE: {
                    this.status = Team.STATUS.LOSER;  
                    return this.status;
                }
                case Objective.STATUS.SUCCESS: {
                    objectivesWon++;
                    break;
                }
            }

            necessaryObjectives++;
        }
    }

    if(necessaryObjectives === objectivesWon) {
        this.status = Team.STATUS.WINNER;
    }

    return this.status;
}

Team.prototype.loadObjectives = function(teamObjectives, allObjectives) {
    for(const objectiveID of teamObjectives) {
        const config = allObjectives[objectiveID];

        if(config) {
            const { type } = config;
            const index = Team.OBJECTIVE_SLOT[type];

            if(index !== undefined) {
                this.objectives[index].addTarget(config);
            }
        }
    }
}

Team.prototype.runObjectives = function(onObjective) {
    for(let i = 0; i < this.objectives.length; i++) {
        const objective = this.objectives[i];
        const { status } = objective;

        if(status === Objective.STATUS.IDLE) {
            onObjective(objective);
        }
    }
}