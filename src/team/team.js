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
    this.buildings = [];
    this.units = new Set();
    this.lynchpins = new Set();
    this.hasLynchpin = false;
    this.faction = null;
    this.nation = null;
    this.actor = null;
    this.colorID = null;
    this.color = null;
    this.status = Team.STATUS.IDLE;
    this.exchangeRate = 1;
    this.funds = 0;
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

Team.prototype.addBuilding = function(building) {
    const buildingID = building.getID();

    for(let i = 0; i < this.buildings.length; i++) {
        if(this.buildings[i].getID() === buildingID) {
            return;
        }
    }

    this.buildings.push(building);
}

Team.prototype.removeBuilding = function(building) {
    const buildingID = building.getID();

    for(let i = 0; i < this.buildings.length; i++) {
        if(this.buildings[i].getID() === buildingID) {
            this.buildings[i] = this.buildings[this.buildings.length - 1];
            this.buildings.pop();
            break;
        }
    }
}

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
    const nationType = typeRegistry.getNationType(nationID);
    const { color, faction, currency } = nationType;

    const factionType = typeRegistry.getFactionType(faction);
    const currencyType = typeRegistry.getCurrencyType(currency);
    const isColorSet = this.setColor(gameContext, color);

    this.nation = nationType;
    this.faction = factionType;

    if(!isColorSet) {
        this.setColor(gameContext, factionType.color);
    }

    if(currencyType) {
        const { exchangeRate } = currencyType;

        this.exchangeRate = exchangeRate;
    }
}

Team.prototype.loadAsFaction = function(gameContext, factionID) {
    const { typeRegistry } = gameContext;
    const factionType = typeRegistry.getFactionType(factionID);
    const { color } = factionType;

    this.faction = factionType;
    this.setColor(gameContext, color);
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

Team.prototype.addUnit = function(entityID) {
    this.units.add(entityID);
}

Team.prototype.addLynchpin = function(entityID) {
    this.lynchpins.add(entityID);
    this.hasLynchpin = true;
}

Team.prototype.onEntityDeath = function(gameContext, entity) {
    const entityID = entity.getID();

    if(this.units.has(entityID)) {
        this.units.delete(entityID);
    }

    if(this.lynchpins.has(entityID)) {
        this.lynchpins.delete(entityID);
    }

    this.runObjectives((objective) => objective.onDeath(gameContext, entity, this.id));
}

Team.prototype.setCustomColor = function(color) {
    this.colorID = "CUSTOM_" + this.id;
    this.color = color;
}

Team.prototype.setColor = function(gameContext, colorID) {
    const { typeRegistry } = gameContext;
    const color = typeRegistry.getSchemaType(colorID);

    if(color) {
        this.colorID = colorID;
        this.color = color;

        return true;
    }

    return false;
}

Team.prototype.isAlly = function(teamID) {
    if(this.id === teamID) {
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

    if(this.units.size === 0 || this.hasLynchpin && this.lynchpins.size === 0) {
        this.status = Team.STATUS.LOSER;

        return this.status;
    }

    let objectivesWon = 0;
    let necessaryObjectives = 0;

    for(const objective of this.objectives) {
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