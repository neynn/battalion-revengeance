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
    this.entities = [];
    this.faction = null;
    this.nation = null;
    this.actor = null;
    this.colorID = null;
    this.color = null;
    this.status = Team.STATUS.IDLE;
    this.exchangeRate = 1;
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

Team.prototype.hasAnyObjective = function() {
    for(let i = 0; i < this.objectives.length; i++) {
        if(this.objectives[i].hasAnyTarget()) {
            return true;
        }
    }

    return false;
}

Team.prototype.loadAsNation = function(gameContext, nationID) {
    const { typeRegistry } = gameContext;

    if(nationID) {
        const nationType = typeRegistry.getType(nationID, TypeRegistry.CATEGORY.NATION);

        if(nationType) {
            const { color, faction, currency } = nationType;
            const factionType = typeRegistry.getType(faction, TypeRegistry.CATEGORY.FACTION)
            const currencyType = typeRegistry.getType(currency, TypeRegistry.CATEGORY.CURRENCY);
            const isColorSet = this.setColor(gameContext, color);

            this.nation = nationType;

            if(factionType) {
                this.faction = factionType;

                if(!isColorSet) {
                    this.setColor(gameContext, factionType.color);
                }
            }

            if(currencyType) {
                const { exchangeRate } = currencyType;

                this.exchangeRate = exchangeRate;
            }
        }
    }
}

Team.prototype.loadAsFaction = function(gameContext, factionID) {
    const { typeRegistry } = gameContext;

    if(factionID) {
        const factionType = typeRegistry.getType(factionID, TypeRegistry.CATEGORY.FACTION);

        if(factionType) {
            const { color } = factionType;

            this.faction = factionType;
            this.setColor(gameContext, color);
        }
    }
}

Team.prototype.getDisplayName = function(gameContext) {
    const { language } = gameContext;

    if(this.nation) {
        return language.get(this.nation.name);
    }

    if(this.faction) {
        return language.get(this.faction.name);
    }

    return language.get("MISSING_NAME");
}

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

    if(color) {
        this.colorID = colorID;
        this.color = color;

        return true;
    }

    return false;
}

Team.prototype.isAlly = function(teamID) {
    if(this.teamID === teamID) {
        return true;
    }
    
    for(let i = 0; i < this.allies.length; i++) {
        if(this.allies[i] === teamID) {
            return true;
        }
    }

    return false;
}

Team.prototype.addAlly = function(teamID) {
    if(!this.isAlly(teamID)) {
        this.allies.push(teamID);
    }
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